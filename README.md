# <!-- omit in toc --> League Stats

## <!-- omit in toc --> Table of Contents

- [About the app](#about-the-app)
- [Download the app](#download-the-app)
    - [Opening the app for the first time](#opening-the-app-for-the-first-time)
- [Stat breakdown](#stat-breakdown)

## About the app

This is an Electron-based application that provides players with detailed stats during the pre-game phase. These stats include pick/win/ban rates for all champions, % advantage (winrate) gained by banning particular champions, and (in the future) personalized ban suggestions based on recent match history.

## Download the app

[Click here](https://github.com/AveryVine/league-stats-app/releases/tag/1.0.0) to view and download the latest release!

The app is supported on macOS and Windows only at the moment. Linux support is coming when I get around to it.

### Opening the app for the first time

Your operating system may try to protect you from an "unidentified developer" or something like that. In order to get around that:

- Mac: right-click (or two-finger-click on a trackpad) the app and hit "Open", which should give you the option to open it anyway
- Windows: after trying to opening the app, click "More Info" on the pop-up, which should give you the option to open it anyway

## Stat breakdown

- Win Rate: percentage of games that a given champion wins
- Play Rate: percentage of games in which a given champion is played
- Ban Rate: percentage of bans that are a given champion (NOT percentage of games in which a given champion is banned)
- **BAN ADVANTAGE:** percentage in win rate gained by banning a given champion
