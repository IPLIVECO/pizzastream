# PizzaStream
[![Author](https://img.shields.io/badge/made%20by-Francesco%20Pomp%C3%B2-blue.svg)](https://francesco.cc)


Ultra-lightweight torrent streamer

## Overview
PizzaStream is an ultra-lightweight Node.JS powered torrent live streamer.  
Thanks to the "torrent-stream" module it is capable of streaming on the fly any type of video inside of a torrent.  
Everything without touching the physical disk (exception done for /tmp).

## Screenshots
![Main view](https://i.imgur.com/zgE8LG8.png)
![Torrent's info view](https://i.imgur.com/Dwxjsqu.png)
![Upload view](https://i.imgur.com/qzii3Bd.png)

## Installation
```Shell
npm install -g pizzastream
```

## Why
I personally had the necessity to have a place where to store my torrents and stream them when I wanted to.
Imagine to have few GBs on your personal devices and you don't want to keep all the torrent data on them.
Here comes PizzaStream which is capable to store only .torrent files and making them available whenever you want.

## Supported formats
Basically everything, but remember that videos can also be streamed in players like VLC :)

## Modules

PizzaStream is based on:

- commander (To correctly handle the cli options)
- js-yaml (For YAML configuration files)
- request (Used in torrent retrieval from URL)
- torrent-stream (To retrieve the torrent data in a sequential and handy way)
- express
- ejs

## TODO
Magnet links support
