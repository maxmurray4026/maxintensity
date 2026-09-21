import UIKit
import Capacitor

/// The app's bridge view controller: registers the local StoreKit plugin and
/// makes the web view feel native (no rubber-band bounce, no pinch zoom, black
/// behind everything, safe areas left to the page).
class MIViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(MIStorePlugin())
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.02, green: 0.02, blue: 0.02, alpha: 1)
        if let wv = webView {
            wv.backgroundColor = view.backgroundColor
            wv.isOpaque = false
            wv.scrollView.bounces = false
            wv.scrollView.alwaysBounceVertical = false
            wv.scrollView.alwaysBounceHorizontal = false
            wv.scrollView.contentInsetAdjustmentBehavior = .never
            wv.scrollView.pinchGestureRecognizer?.isEnabled = false
            wv.allowsLinkPreview = false
        }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }
}
