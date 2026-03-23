# LookAway - GNOME Shell Extension

Protects your eyes from screen strain using the **20/20/20 rule**: every **20 minutes**, look at something **20 feet** (~6 metres) away for at least **20 seconds**.

A countdown timer in the GNOME top bar flashes red and blinks the eye icon when it's time to rest. Fully configurable screen time and eye rest durations via a preferences dialog.

## Features

- Countdown timer with eye icon in the top bar
- Automatic screen time / eye rest cycling
- Flashing red text and blinking eye icon on rest alert
- Pause, resume, reset, and skip controls
- Configurable via libadwaita preferences dialog
- GNOME Shell 45-48

## Installation

```bash
git clone https://github.com/guillermodotn/lookaway.git
cd lookaway
./install.sh
```

Then log out and back in, or run `gnome-extensions enable lookaway@gnome-extension`.

To uninstall: `./uninstall.sh`

## Configuration

```bash
gnome-extensions prefs lookaway@gnome-extension
```

## The 20/20/20 Rule

A guideline from the American Academy of Ophthalmology to reduce eye strain from prolonged screen use. Prolonged near-focus work reduces blink rate and can lead to dry eyes, blurred vision, and headaches. Regular distance-focus breaks help relax the ciliary muscle and restore normal blinking.

## License

GPL-3.0-or-later — see [LICENSE](LICENSE) for details.
