# EasyRaceLapTimer RaceBox

This is the offical App for the [EasyRaceLapTimer RaceBox](https://www.airbirds-shop.de/de/easyracelaptimer/37-easyracelaptimer-easyracelaptimer-racebox.html) from [AirBirds](http://www.airbirds.de).

NOTE: This is no longer a Google chrome app but a stand alone application


## SmartSense - What the heck is SmartSense? ##

VTX transmitters have different output power on their channels. So the timing for each unit would be different. SmartSense tries to compensate this by computing all the time the highest  RSSI signal it gets from an unit. The minimum RSSI signal gets increased internally by the box, so that the minimum RSSI trigger strength is the highest value it computed minus the SmartSense CutOff value.

## Serial Commands##

Here you can find all the serial commands which the RaceBox understands. You can use them to support another software with the box if you want.

Baudrate to use: 115200

    RST_TIMING

Reset all timing data in the box. Used for (re)starting a race.  


    SLAVES_RSSI_STRENGTH

Returns the saved RSSI trigger strength for each receiver in the box.


    SLAVES_CRSSI_STRENGTH

Returns the current RSSI signal strength of each receiver in the box.


    SLAVE_CHANNELS

Returns the saved channel for each receiver.


    S_VTX_STR X Y

Sets the minimum RSSI trigger strength Y for receiver X

    S_VTX_CH X Y

Sets the channel Y for receiver X


    SLAVES_SET_MLT X

Sets the minimum lap time for all receivers

    SLAVES_MLT

Returns the minimum lap time for all receivers

    SLAVES_SS_GS

SmartSense Get Strength - get the current calculated smart sense for all receivers


    SLAVES_SS_GCO

SmartSense Get CutOff - gets the saved cuf off value for all receivers


    SLAVES_SS_SCO X Y

SmartSense Set CutOff - sets the cut off value Y for receiver X


    VERSION

Returns masters and all sensor firmware version (implemented in version 1.1)
