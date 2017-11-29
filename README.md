# ![Harmonicarium](http://harmonicarium.org/harmonicarium_logo.png "Harmonicarium, a Dynamic Harmonics Calculator")
a Dynamic Harmonics Calculator

## What is this?
The Harmonicarium is a platform that allow the user/musician to play the Harmonic Series and change its fundamental tone in real-time. Just like the overtone singers do with the [polyphonic overtone singing technique](https://www.youtube.com/watch?v=haz6W7p8xjM). The idea is to play a fundamental-variable harmonic series on electronic and electro-acoustical instruments retuned via MIDI and in real-time.

![Harmonicarium](http://harmonync.org/wp-content/uploads/slide003.jpg)

It's based on the Pure Data prototype patch "**[Harmonync](https://github.com/IndustrieCreative/Harmonync)**", developed between 2013 and 2016.

To better understand, you can read the [**project overview** on the home site](http://harmonicarium.org/project-overview/).

Harmonicarium's **source code** repository [is available on GitHub](https://github.com/IndustrieCreative/Harmonicarium).

## Applications
* Musical performances and playing music.
* Music composition for...
  * overtone singers and choirs;
  * "overtone instruments" (i.e. natural brasses/horns – or the sax altissimo technique; the [Đàn bầu](https://en.wikipedia.org/wiki/%C4%90%C3%A0n_b%E1%BA%A7u) that use the string flageolets phenomenon);
  * microtonal musicians.
* Polyrhythm composition and research.
* Research about the musical theory.
* Musicotherapy and sound therapy.
* Creative additive sound synthesis.
* Scientific probes; realtime tone/signal generation for...
  * environmental acoustic tests (i.e. [modal analysis](https://en.wikipedia.org/wiki/Modal_analysis));
  * physical  actuators (i.e. [sonotrode](https://en.wikipedia.org/wiki/Sonotrode));
  * ...

## System requirements
Harmonicarium is written in **JavaScript** (used **ES6** features) and uses the **[Web MIDI](https://www.w3.org/TR/webmidi/)** and **[Web AUDIO](https://www.w3.org/TR/webaudio/) API**.
Actually it has been tested on **Google Chrome** v61+ under macOS (v10.11+), Windows (v10) and Android (v5+) but it could run on other browsers supporting the Web MIDI and AUDIO API.

**At the moment you need Google Chrome** or Chromium. It has been developed on a high performance desktop/laptop environment and actually, no optimization has been made in order to minimize the computational load. 

**Partially untested on mobile devices**. On embedded Android devices I have experienced slow data processing (delay in output audio response). The [Qwerty Hancock](https://github.com/stuartmemo/qwerty-hancock) keyboard seems to support multitouch events. This means that on low performance system you could may experience slowdowns.

Though Harmonync has the MIDI-OUT-RETUNING feature (that is the main purpose of these software), the Harmonicarium is still under development and the MIDI-OUT is not ready at the moment. We must first create a better user&mobile-friendly GUI.

## Quick Start
This program is a web app. This means that it uses the HTML5 technology and you need a browser to use it. As I said at this moment you need Chrome.
1. If you don't have Google **Chrome** on your system, download [here](https://www.google.com/chrome/browser/desktop/index.html) and install it.
2. Run the app's URL in the browser. You can:
   * open the online version [harmonicarium.org/app](http://harmonicarium.org/app);
   * download [the sources](https://github.com/IndustrieCreative/Harmonicarium/zipball/master) from GitHub and open "index.html" to run a local instance of the app.

Note: Of course, if you run the app locally, do not rename or move any other file inside the main folder. You can rename and move only the main folder.
  
## How to use it?
Visit [harmonicarium.org](http://harmonicarium.org/) for the **Tutorials**. There is no comprehensive guide at this moment, it is currently being drafted. A video-guide and a step-by-step tutorial will be released as soon as possible. For any questions, do not hesitate to contact Walter Mantovani at armonici.it[*at*]gmail[*dot*]com.

Now (November 20, 2017) the **harmonicarium.org** site is under construction. You can temporarily visit the old project site: **[harmonync.harmonicarium.org](https://harmonync.harmonicarium.org)**

## A first public document about the DHC
The document "**A first look at THE HARMONYNC: A Dynamic Harmonics Calculator – Draft of Specifications and User Guide**" is available [here](http://harmonync.harmonicarium.org/a_first_look_at_the_harmonync.pdf) and has the following DOI: [10.978.88940077/01](http://dx.doi.org/10.978.88940077/01)

## Contribute... or fork!
The code is over-commented because I'm not a professional programmer and overnight coding does not help memory;) I apologize to the expert coders for this but I know that musicians will appreciate it!

Actually there are two main issues:
  1. The actual **UI** sucks. Help is needed to create an intuitive, responsive and touch-events-compliant UI.
  2. A DHC should be **modular** (imagine a chain of DHCs... –_–). So it is necessary to reduce the global objects/functions and put some order. Move the functions into the respective methods of few main objects. In this way the DHC engine could become a library.

Having done these things, there are other two main milestones to reach:
  
  3. Implement **MIDI-Out** tuning (e.g. to play the Harmonic Series on an analog synthesizer).
  4. Implement **polyrhythms** generation (nothing but harmonics in the infrasound domain).
  
If you have any suggestions, you can write directly to the email in the license note or use the ["**Issues**" section](https://github.com/IndustrieCreative/Harmonicarium/issues) of the GitHub repository. And if you are a coder, ever help is welcome!

See also [the **contact page**](http://harmonicarium.org/contacts/) on the project site.

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

armonici.it *[at]* gmail *[dot]* com.