import Foundation
import Capacitor
import StoreKit

/// StoreKit 2 for the Max Intensity membership. No third party: products,
/// purchase, restore and the current entitlement, each returning the signed
/// transaction (JWS) so the worker can verify it and keep web and app in step.
/// Registered from MIViewController.capacitorDidLoad(); called from native.js as `MIStore`.
@objc(MIStorePlugin)
public class MIStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MIStorePlugin"
    public let jsName = "MIStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "current", returnType: CAPPluginReturnPromise),
    ]

    private var updates: Task<Void, Never>? = nil

    public override func load() {
        // keep entitlements fresh when a renewal / refund lands while the app is open
        updates = Task.detached { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let t) = result {
                    await t.finish()
                    self?.notifyListeners("transaction", data: ["productId": t.productID])
                }
            }
        }
    }

    deinit { updates?.cancel() }

    @available(iOS 15.0, *)
    private func describe(_ p: Product) -> [String: Any] {
        var d: [String: Any] = [
            "id": p.id,
            "title": p.displayName,
            "description": p.description,
            "price": p.displayPrice,
            "priceValue": (p.price as NSDecimalNumber).doubleValue,
            "currency": p.priceFormatStyle.currencyCode,
        ]
        if let sub = p.subscription {
            d["period"] = "\(sub.subscriptionPeriod.value) \(sub.subscriptionPeriod.unit)"
            if let intro = sub.introductoryOffer {
                d["trial"] = ["type": intro.paymentMode == .freeTrial ? "free" : "intro", "period": "\(intro.period.value) \(intro.period.unit)", "price": intro.displayPrice]
            }
        }
        return d
    }

    @available(iOS 15.0, *)
    private func payload(_ t: Transaction, jws: String) -> [String: Any] {
        return [
            "ok": true,
            "productId": t.productID,
            "originalTransactionId": String(t.originalID),
            "transactionId": String(t.id),
            "expires": t.expirationDate.map { $0.timeIntervalSince1970 * 1000 } ?? 0,
            "trial": t.offerType == .introductory,
            "jws": jws,
        ]
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.reject("iOS 15 or later is needed for subscriptions"); return }
        let ids = call.getArray("ids", String.self) ?? []
        Task {
            do {
                let products = try await Product.products(for: ids)
                call.resolve(["products": products.map { self.describe($0) }])
            } catch { call.reject("Could not load products: \(error.localizedDescription)") }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.reject("iOS 15 or later is needed for subscriptions"); return }
        guard let id = call.getString("id") else { call.reject("id is required"); return }
        Task { @MainActor in
            do {
                guard let product = try await Product.products(for: [id]).first else { call.reject("Unknown product \(id)"); return }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let t):
                        await t.finish()
                        call.resolve(self.payload(t, jws: verification.jwsRepresentation))
                    case .unverified(_, let err):
                        call.reject("Purchase could not be verified: \(err.localizedDescription)")
                    }
                case .userCancelled: call.resolve(["ok": false, "cancelled": true])
                case .pending: call.resolve(["ok": false, "pending": true])
                @unknown default: call.resolve(["ok": false])
                }
            } catch { call.reject("Purchase failed: \(error.localizedDescription)") }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.reject("iOS 15 or later is needed for subscriptions"); return }
        Task {
            do {
                try await AppStore.sync()
                if let found = await self.latestEntitlement() { call.resolve(found) } else { call.resolve(["ok": false, "none": true]) }
            } catch { call.reject("Restore failed: \(error.localizedDescription)") }
        }
    }

    @objc func current(_ call: CAPPluginCall) {
        guard #available(iOS 15.0, *) else { call.resolve(["ok": false]); return }
        Task {
            if let found = await self.latestEntitlement() { call.resolve(found) } else { call.resolve(["ok": false, "none": true]) }
        }
    }

    @available(iOS 15.0, *)
    private func latestEntitlement() async -> [String: Any]? {
        var best: [String: Any]? = nil
        var bestExpiry: Date = .distantPast
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result, t.revocationDate == nil {
                let exp = t.expirationDate ?? .distantFuture
                if exp > bestExpiry { bestExpiry = exp; best = payload(t, jws: result.jwsRepresentation) }
            }
        }
        return best
    }
}
