# Form library — reference videos

One .mp4 per exercise, named by the exercise slot (the app shows the slot on
every Form sheet and in Settings → Form videos):

    assets/form/<exercise-slug>.mp4

The slug is the exercise name lower-cased, brackets removed, anything that is
not a letter or digit replaced by a hyphen. Examples:

| Exercise | File |
| --- | --- |
| Incline Dumbbell Press | `incline-dumbbell-press.mp4` |
| Straight-Arm Cable Pulldown | `straight-arm-cable-pulldown.mp4` |
| Assisted Dips (machine) | `assisted-dips.mp4` |
| Hip Thrust / 45° Glute Raise | `hip-thrust-45-glute-raise.mp4` |
| Smith Press Behind Neck | `smith-press-behind-neck.mp4` |

Portrait 9:16, H.264, under ~8 MB, shirt on, one clean set at 3-1-3-1. Drop the
file in and commit — the app checks for it on load and swaps the "Form video
coming" placeholder for the player. No code change needed.
