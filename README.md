# ![Harmonicarium](https://harmonicarium.org/harmonicarium_logo.png "Harmonicarium, a Dynamic Harmonics Calculator")
a Dynamic Harmonics Calculator

## What is this?
The Harmonicarium is a platform that allow the user/musician to play the Harmonic Series and change its
fundamental tone in real-time. Just like the overtone singers do with the
[polyphonic overtone singing technique](https://www.youtube.com/watch?v=haz6W7p8xjM). The idea is to play
a fundamental-variable harmonic series on electronic and electro-acoustical instruments retuned via MIDI
and in real-time.

We can say it's a microtonal music tool, specifically designed to play and explore the Harmonic Series.

![Harmonicarium](https://harmonicarium.org/wp-content/uploads/slide003.jpg)

It's based on the Pure Data prototype patch "**[Harmonync](https://github.com/IndustrieCreative/Harmonync)**",
developed between 2013 and 2016.

To better understand, you can read the [**project overview** on the home site](https://harmonicarium.org/project-overview/).

Harmonicarium's **source code** repository [is available on GitHub](https://github.com/IndustrieCreative/Harmonicarium).

The **API Documentation** [is available on GitHub Pages](https://industriecreative.github.io/Harmonicarium/).

## Potential applications
* Musical performances and playing music.
* Music composition for...
  * overtone singers and choirs;
  * "overtone instruments" (i.e. natural brasses/horns – or the sax altissimo technique;
    the [Đàn bầu](https://en.wikipedia.org/wiki/%C4%90%C3%A0n_b%E1%BA%A7u) that use the string flageolets
    phenomenon);
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
Harmonicarium is written in **JavaScript** (used **ES6** features) and uses the
**[Web MIDI](https://www.w3.org/TR/webmidi/)** and **[Web AUDIO](https://www.w3.org/TR/webaudio/) API**.
Currently it has been tested on **Google Chrome** v61+ under macOS (v10.11+), Windows (v10) and Android (v5+)
but it could run on other browsers supporting both, the Web MIDI and AUDIO API (actually Opera and Microsoft
Edge).

**At the moment you need Google Chrome** or Chromium. The software has been developed on a high performance
workstation environment and currently no optimization has been made in order to minimize the computational load. 

**Partially untested on mobile devices**. On embedded Android devices I have experienced slow data processing
(delay in output audio response). This means that on low performance system you could may experience slowdowns.
The [Qwerty Hancock](https://github.com/stuartmemo/qwerty-hancock) keyboard seems to support multitouch events.

## Quick Start
This program is a web-app with PWA features. This means that it uses the HTML5 technology and you need a
browser-container to run it. As I said at this moment you should use Chrome, but you can try also the others.

1. If you don't have Google **Chrome** on your system, download
   [here](https://www.google.com/chrome/browser/desktop/index.html) and install it.
2. Run the app's URL in the browser. You can:
   * open the online version **[harmonicarium.org/app](https://harmonicarium.org/app)**;
   * download [the sources](https://github.com/IndustrieCreative/Harmonicarium/zipball/master)
     from GitHub and open "index.html" to run a local instance of the app.

> NOTES:
> * On Android/iOS mobile devices the "local version" of the app could not work "directly".
> * To use Harmonicarium locally with Android, there is a little workaround. If your version of Android does
    not allow you to open html files with Chrome, you can try to unzip the .zip in the internal memory
    (on some phone does not work if it is on the SD) and write **file:///sdcard** in the Chrome's address bar.
    Now go to look for the app's folder by navigating through the files and start index.html directly from Chrome.
> * Of course, if you run the app locally, do not rename or move any other file inside the main folder.
    You can rename and move only the main folder.
  
## How to use it?
Visit [harmonicarium.org](https://harmonicarium.org/) for the **Tutorials**.
There is no comprehensive guide at this moment, it is currently being drafted.
A video-guide and a step-by-step tutorial will be released as soon as possible.
For any questions, do not hesitate to contact Walter Mantovani at armonici.it[*at*]gmail[*dot*]com.

Currently (February, 2022) the **[harmonicarium.org](https://harmonicarium.org/)** site still has a basic
documentation but you can also visit the old project site to get more information:
**[harmonync.harmonicarium.org](https://harmonync.harmonicarium.org)**

## A first public document about the DHC idea
The document "**A first look at THE HARMONYNC: A Dynamic Harmonics Calculator – Draft of Specifications and
User Guide**" is available [here](https://harmonync.harmonicarium.org/a_first_look_at_the_harmonync.pdf) and
has the following DOI: [10.978.88940077/01](https://dx.doi.org/10.978.88940077/01)

## Roadmap – Contribute... or fork!
The **API Documentation** [is available on GitHub Pages](https://industriecreative.github.io/Harmonicarium/).

From version 0.6.0 the entire code has been totally refactored to be more modular, and also the **UI**
is become more intuitive, responsive and touch-events-compliant.
The app is now a PWA (progressive web app) and so you can install it on your device if you wish.

Currently there are two main issues:

  1. Improve the design of the Setting panel (backend) using an UI framework. And we have to chose what to use.
     Currently all the UI widgets are the default broswer ones. There is no responsiveness! Use settings on
     mobile devices is a true hell.
  2. The "module" diphonicpad.js (the new UI, the frontend) is not complete yet and so is undocumented.
     I have to revise all the functions in it and make further testing on mobile devices. After that, I will
     try to make it multi-touch as well.

Having done these things, there are other two main milestones to reach:
  
  3. Add some tools for the visualization of sound: oscilloscope, lissajous curve, spectrum, spectrogram and
     a "tonal spiral" like [this](https://suonoterapia.org/overtones/).
  4. Implement **polyrhythms** generation (nothing but harmonics in the infrasound domain).
  
If you have any suggestions, you can write directly to the email in the license note or use the
["**Issues**" section](https://github.com/IndustrieCreative/Harmonicarium/issues) of the GitHub repository.
And if you are a coder, ever help is welcome!

See also [the **contact page**](https://harmonicarium.org/contacts/) on the project site.

## Older versions
* Open version 0.6.0 (Galilei): [App](https://harmonicarium.org/apps/galilei/) – [Source code](https://github.com/IndustrieCreative/Harmonicarium/tree/v0.6.0)

## License
Harmonicarium – a Dynamic Harmonics Calculator
Copyright (C) 2017-2022 by Walter Mantovani

This program is free software: you can redistribute it and/or modify it under the terms of the
**GNU Affero General Public License** as published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public
License for more details.

You should have received a copy of the GNU Affero General Public License along with this program.  If not,
see <http://www.gnu.org/licenses/>.

armonici.it *[at]* gmail *[dot]* com.