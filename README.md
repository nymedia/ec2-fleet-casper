ec2-fleet-casper
================
[![Build Status](https://travis-ci.org/nymedia/ec2-fleet-casper.svg?branch=master)](https://travis-ci.org/nymedia/ec2-fleet-casper)
[![Dependency Status](https://david-dm.org/nymedia/ec2-fleet-casper.svg?theme=shields.io)](https://david-dm.org/nymedia/ec2-fleet-casper)

A load testing tool with a full browser. Heavily inspired by (and with lots of code from) [ec2-fleet](https://github.com/ashtuchkin/ec2-fleet).

# Requirements

- [Node JS](http://nodejs.org)
- npm (Should probably be installed with the above).

# Installing

- Clone this repository
- Install dependencies (`npm install`)

# Configuring

- Copy the file `config/default-config.json` to a file called `config/default.json`
- Edit the file `config/default.json` to include your aws credentials and preferred options.

# Running

Running the command `./aws.js --help` should give you some hints.

A typical session may look like this:

#### Start some instances.
`./aws.js start 10`

#### Open the "top-like" utility to monitor when all instances are ready (typically in its own tab).
`./aws.js status`

#### Download the casper script to run on all instances.
`./aws.js set testScript http://example.com/my_script.js`

#### Switch to status tab, see that all instances get the "has_script:true" status.

#### Start the clients with setting the total number of runs.
`./aws.js set n 200`

#### Start some clients. Set concurrency to number of concurrent clients (this is per instance)
`./aws.js set concurrency 10`

#### Download the output (screenshots, casper output and whatnot)
`./aws.js dump`

The downloaded dumps will be in directories in `./dumps` - one per instance.
