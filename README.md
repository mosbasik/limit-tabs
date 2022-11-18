Limit Tabs
==========

This repo is an unaffiliated fork of the [Limit Tabs](https://addons.mozilla.org/en-US/firefox/addon/rudolf-fernandes/) Firefox add-on by Rudolf Fernandes.

It exists because I wanted to tweak some behaviors and maybe report or fix some bugs, but [the original project doesn't maintain a public repository](https://addons.mozilla.org/en-US/firefox/addon/rudolf-fernandes/reviews/1716913/).


Upstream info
-------------

Here's a list of the upstream versions: https://addons.mozilla.org/en-US/firefox/addon/rudolf-fernandes/versions/

This repo is currently based on upstream's [v2.2.6](https://addons.mozilla.org/firefox/downloads/file/3981490/rudolf_fernandes-2.2.6.xpi) (download link).  I don't intend to try and keep particular track of upstream releases, but if I notice one I can try to rebase my changes onto it if applicable.


Changes in this fork
--------------------

- **Bugfix**: The act of loading the add-on's preferences tab was causing it to enter "current window limit" mode, regardless of whether it had been in "current tab" mode or "global mode" before that.

- **Feature**: Renamed upstream's "Least Recently Used" strategy to "Least Recently Used (Current Window) and added a new strategy "Least Recently Used (All Windows)"
