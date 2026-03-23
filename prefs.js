/**
 * LookAway - Preferences Dialog
 *
 * Provides a simple UI to configure screen time (minutes)
 * and eye rest duration (seconds).
 *
 * GNOME 45+ ESM format.
 */

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class LookAwayPrefs extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        /* -- Page -------------------------------------------------- */
        const page = new Adw.PreferencesPage({
            title: 'LookAway',
            icon_name: 'view-reveal-symbolic',
        });
        window.add(page);

        /* -- Group: Timing ----------------------------------------- */
        const timingGroup = new Adw.PreferencesGroup({
            title: 'Timer Settings',
            description: 'Configure your eye care intervals based on the 20/20/20 rule.\n'
                       + 'Every 20 minutes, look at something 20 feet away for 20 seconds.',
        });
        page.add(timingGroup);

        /* Screen time duration */
        const workRow = new Adw.SpinRow({
            title: 'Screen Time',
            subtitle: 'Minutes of screen time before an eye rest is triggered',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 120,
                step_increment: 1,
                page_increment: 5,
                value: settings.get_int('work-duration'),
            }),
        });
        settings.bind('work-duration', workRow, 'value',
            Gio.SettingsBindFlags.DEFAULT);
        timingGroup.add(workRow);

        /* Eye rest duration */
        const breakRow = new Adw.SpinRow({
            title: 'Eye Rest Duration',
            subtitle: 'Seconds to look away and rest your eyes',
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 300,
                step_increment: 5,
                page_increment: 10,
                value: settings.get_int('break-duration'),
            }),
        });
        settings.bind('break-duration', breakRow, 'value',
            Gio.SettingsBindFlags.DEFAULT);
        timingGroup.add(breakRow);

        /* -- Group: About ------------------------------------------ */
        const aboutGroup = new Adw.PreferencesGroup({
            title: 'About',
        });
        page.add(aboutGroup);

        const aboutRow = new Adw.ActionRow({
            title: 'LookAway v1',
            subtitle: 'Protect your eyes from screen strain with regular rest breaks.',
        });
        aboutGroup.add(aboutRow);
    }
}
