/**
 * LookAway - GNOME Shell Extension
 *
 * Protects your eyes from screen strain using the 20/20/20 rule.
 * Every 20 minutes, reminds you to look at something 20 feet away
 * for 20 seconds.  Shows a countdown in the top bar and flashes
 * red when it's time to rest your eyes.
 *
 * Compatible with GNOME Shell 45+ (ESM module format).
 */

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const DEFAULT_WORK_MINUTES  = 20;   // work interval
const DEFAULT_BREAK_SECONDS = 20;   // break interval
const FLASH_INTERVAL_MS     = 500;  // toggle flash every 500 ms
const FLASH_DURATION_S      = 20;   // how long to flash (matches break)

/* ------------------------------------------------------------------ */
/*  Indicator (the panel button)                                      */
/* ------------------------------------------------------------------ */
const LookAwayIndicator = GObject.registerClass(
class LookAwayIndicator extends PanelMenu.Button {

    _init(ext) {
        super._init(0.0, 'LookAway', false);

        this._ext = ext;
        this._settings = ext.getSettings();

        /* --- state ------------------------------------------------ */
        this._workSeconds   = this._settings.get_int('work-duration') * 60;
        this._breakSeconds  = this._settings.get_int('break-duration');
        this._remaining     = this._workSeconds;
        this._onBreak       = false;
        this._paused        = false;
        this._tickSourceId  = 0;
        this._flashSourceId = 0;
        this._flashOn       = false;
        this._flashCount    = 0;

        /* --- UI --------------------------------------------------- */
        // Container box for icon + label
        this._box = new St.BoxLayout({ style_class: 'panel-status-menu-box' });

        // Eye icon
        this._icon = new St.Icon({
            icon_name: 'view-reveal-symbolic',
            style_class: 'system-status-icon',
        });
        this._box.add_child(this._icon);

        // Timer label
        this._label = new St.Label({
            text: this._formatTime(this._remaining),
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'lookaway-label',
        });
        this._box.add_child(this._label);

        this.add_child(this._box);

        /* --- popup menu ------------------------------------------- */
        this._buildMenu();

        /* --- react to settings changes ---------------------------- */
        this._settingsChangedId = this._settings.connect('changed', () => {
            this._applySettings();
        });

        /* --- start ------------------------------------------------ */
        this._startTick();
    }

    /* ============================================================== */
    /*  Menu                                                          */
    /* ============================================================== */
    _buildMenu() {
        // Status line
        this._statusItem = new PopupMenu.PopupMenuItem('Status: Screen time', {
            reactive: false,
        });
        this.menu.addMenuItem(this._statusItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Pause / Resume
        this._pauseItem = new PopupMenu.PopupMenuItem('Pause');
        this._pauseItem.connect('activate', () => this._togglePause());
        this.menu.addMenuItem(this._pauseItem);

        // Reset
        const resetItem = new PopupMenu.PopupMenuItem('Reset Timer');
        resetItem.connect('activate', () => this._resetTimer());
        this.menu.addMenuItem(resetItem);

        // Skip (jump to break or back to work)
        this._skipItem = new PopupMenu.PopupMenuItem('Skip to Eye Rest');
        this._skipItem.connect('activate', () => this._skip());
        this.menu.addMenuItem(this._skipItem);
    }

    /* ============================================================== */
    /*  Timer logic                                                   */
    /* ============================================================== */
    _startTick() {
        if (this._tickSourceId)
            return;

        this._tickSourceId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT, 1, () => {
                if (!this._paused)
                    this._tick();
                return GLib.SOURCE_CONTINUE;
            });
    }

    _stopTick() {
        if (this._tickSourceId) {
            GLib.source_remove(this._tickSourceId);
            this._tickSourceId = 0;
        }
    }

    _tick() {
        if (this._remaining > 0) {
            this._remaining--;
            this._label.set_text(this._formatTime(this._remaining));
        }

        if (this._remaining <= 0) {
            if (this._onBreak) {
                // Break just ended -> go back to work
                this._endBreak();
            } else {
                // Work period ended -> start break + flash
                this._startBreak();
            }
        }
    }

    /* ---- break management ---------------------------------------- */
    _startBreak() {
        this._onBreak = true;
        this._remaining = this._breakSeconds;
        this._label.set_text(this._formatTime(this._remaining));
        this._statusItem.label.set_text('Status: Rest your eyes - Look away!');
        this._skipItem.label.set_text('Skip Eye Rest');

        // Add the break style
        this._label.add_style_class_name('lookaway-break');
        this._icon.add_style_class_name('lookaway-break');

        this._startFlash();
    }

    _endBreak() {
        this._onBreak = false;
        this._stopFlash();

        // Remove all alert/break styles
        this._label.remove_style_class_name('lookaway-break');
        this._label.remove_style_class_name('lookaway-flash');
        this._icon.remove_style_class_name('lookaway-break');
        this._icon.remove_style_class_name('lookaway-flash');

        // Reset to work duration
        this._remaining = this._workSeconds;
        this._label.set_text(this._formatTime(this._remaining));
        this._statusItem.label.set_text('Status: Screen time');
        this._skipItem.label.set_text('Skip to Eye Rest');
    }

    /* ---- flashing ------------------------------------------------ */
    _startFlash() {
        this._flashOn = false;
        this._flashCount = 0;
        const maxFlashes = (FLASH_DURATION_S * 1000) / FLASH_INTERVAL_MS;

        this._flashSourceId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT, FLASH_INTERVAL_MS, () => {
                this._flashOn = !this._flashOn;
                this._flashCount++;

                if (this._flashOn) {
                    this._label.add_style_class_name('lookaway-flash');
                    this._icon.add_style_class_name('lookaway-flash');
                    this._icon.icon_name = 'view-conceal-symbolic';
                } else {
                    this._label.remove_style_class_name('lookaway-flash');
                    this._icon.remove_style_class_name('lookaway-flash');
                    this._icon.icon_name = 'view-reveal-symbolic';
                }

                if (this._flashCount >= maxFlashes) {
                    // Keep the break style but stop toggling
                    this._icon.icon_name = 'view-conceal-symbolic';
                    this._flashSourceId = 0;
                    return GLib.SOURCE_REMOVE;
                }
                return GLib.SOURCE_CONTINUE;
            });
    }

    _stopFlash() {
        if (this._flashSourceId) {
            GLib.source_remove(this._flashSourceId);
            this._flashSourceId = 0;
        }
        // Restore the open eye icon
        this._icon.icon_name = 'view-reveal-symbolic';
    }

    /* ---- controls ------------------------------------------------ */
    _togglePause() {
        this._paused = !this._paused;
        this._pauseItem.label.set_text(this._paused ? 'Resume' : 'Pause');
        if (this._paused) {
            this._label.add_style_class_name('lookaway-paused');
        } else {
            this._label.remove_style_class_name('lookaway-paused');
        }
    }

    _resetTimer() {
        this._stopFlash();
        this._label.remove_style_class_name('lookaway-flash');
        this._label.remove_style_class_name('lookaway-break');
        this._label.remove_style_class_name('lookaway-paused');
        this._icon.remove_style_class_name('lookaway-flash');
        this._icon.remove_style_class_name('lookaway-break');
        this._onBreak = false;
        this._paused = false;
        this._remaining = this._workSeconds;
        this._label.set_text(this._formatTime(this._remaining));
        this._statusItem.label.set_text('Status: Screen time');
        this._skipItem.label.set_text('Skip to Eye Rest');
        this._pauseItem.label.set_text('Pause');
    }

    _skip() {
        if (this._onBreak) {
            this._endBreak();
        } else {
            this._remaining = 0;
            this._tick();
        }
    }

    /* ---- settings ------------------------------------------------ */
    _applySettings() {
        const newWork  = this._settings.get_int('work-duration') * 60;
        const newBreak = this._settings.get_int('break-duration');

        const workChanged  = newWork  !== this._workSeconds;
        const breakChanged = newBreak !== this._breakSeconds;

        this._workSeconds  = newWork;
        this._breakSeconds = newBreak;

        // If we're not on break and work duration changed, reset
        if (!this._onBreak && workChanged) {
            this._remaining = this._workSeconds;
            this._label.set_text(this._formatTime(this._remaining));
        }
        // If on break and break duration changed, adjust
        if (this._onBreak && breakChanged) {
            this._remaining = this._breakSeconds;
            this._label.set_text(this._formatTime(this._remaining));
        }
    }

    /* ============================================================== */
    /*  Helpers                                                       */
    /* ============================================================== */
    _formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    /* ============================================================== */
    /*  Cleanup                                                       */
    /* ============================================================== */
    destroy() {
        this._stopTick();
        this._stopFlash();

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }

        super.destroy();
    }
});

/* ================================================================== */
/*  Extension entry point                                             */
/* ================================================================== */
export default class LookAwayExtension extends Extension {
    enable() {
        this._indicator = new LookAwayIndicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
