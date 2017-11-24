# ![Harmonicarium](http://harmonicarium.org/harmonicarium_logo.png "Harmonicarium, a Dynamic Harmonics Calculator")
a Dynamic Harmonics Calculator

## What is this?
The Harmonicarium is a platform that allow the user/musician to play the Harmonic Series and changing its fundamental tone in real-time.
Just like the overtone singers do with the [polyphonic overtone singing technique](https://www.youtube.com/watch?v=haz6W7p8xjM).
The idea is to play a fundamental-variable harmonic series on electronic and electro-acoustical instruments retuned via MIDI and in real-time.

![Concept 1](http://harmonync.org/wp-content/uploads/slide003.jpg "Harmonicarium, a Dynamic Harmonics Calculator")

It's based on the Pure Data prototype patch "**[Harmonync](https://github.com/IndustrieCreative/Harmonync)**", developed between 2013 and 2016.

Harmonicarium is written in JavaScript (used ES6 features) and uses the Web MIDI API and Web AUDIO API.
Actually it has been tested on Google Chrome v.61+ under macOS (10.11+), Windows (v10) and Android (v5+) but it could run on other browsers supporting the Web MIDI and AUDIO API.

Due to poor uniformity in the implementation of the Web Audio/MIDI API between different broswer, **at the moment you need Google Chrome or Chromium**.
The sources are available [on GitHub](https://github.com/IndustrieCreative/Harmonicarium).

## Quick Start
  1. If you don't have Google Chrome on your system, download [here](https://www.google.com/chrome/browser/desktop/index.html) and install it.
  2. Open the [online version](http://webapp.harmonicarium.org/) or download [the sources](https://github.com/IndustrieCreative/Harmonicarium/zipball/master) and open "index.html" to run a local instance of the app.

Note: Of course, if you run the app locally, do not rename or move any other file inside the main folder. You can rename and move only the main folder.
  
## How to use it?
Visit [harmonicarium.org](http://harmonicarium.org/) for the **Tutorials**. There is no comprehensive guide at this moment, it is currently being drafted. A video-guide and a step-by-step tutorial will be released as soon as possible. For any questions, do not hesitate to contact Walter Mantovani at armonici.it[*at*]gmail[*dot*]com.

Now (November 20, 2017) the **harmonicarium.org** site is under contruction. You can temporarily visit the old project site: **[harmonync.harmonicarium.org](https://harmonync.harmonicarium.org)**

## MIDI I/O
In order to make the most of the Harmonicarium you need a MIDI (input) controller like a master keyboard.
The main purpose of this software is retuning a MIDI instrument. Though Harmonync has the MIDI-OUT-RETUNING feature, the Harmonicarium is still under development and the MIDI-OUT is not ready at the moment. We must first create a better user&mobile-friendly GUI.

## First public document about a DHC
The document "**A first look at THE HARMONYNC: A Dynamic Harmonics Calculator – Draft of Specifications and User Guide**" is available [here](http://harmonync.harmonicarium.org/a_first_look_at_the_harmonync.pdf) and has the following DOI: [10.978.88940077/01](http://dx.doi.org/10.978.88940077/01)

## Contribute or fork!
The code is over-commented because I'm not a professional programmer and overnight coding does not help memory;) I apologize for this. I started learn JavaScript in order to write this software, so I'm not practical with UI design.
Actually there are two main issues:
  1. The actual UI sucks. Help is needed to create an intuitive, responsive and touch-events-compliant UI.
  2. A DHC should be modular (imagine a chain of DHC! –_–). So it is necessary to reduce the global objects/functions and put some order. Move the functions into the respective methods of few main objects. In this way the DHC engine could become a library...


## License
Harmonicarium – a Dynamic Harmonics Calculator
Copyright (C) 2017 by Walter Mantovani

This program is free software: you can redistribute it and/or modify
it under the terms of the **GNU Affero General Public License** as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

armonici.it [*at*] gmail [*dot*] com.
