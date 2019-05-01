# OnVif command line interface

Simple utility to interact with OnVif compatible devices.
2 commands are implemented for now: *reboot* and *set resolution*

Both commands expect:
* an address (can be a URN -without *urn:* prefix - if the camera is discoverable, or else a host name / IP Address), 
* a username,
* a password.

## Reboot

```
node index.js reboot -u myonvif_username -p password321 uuid:81111-1221-331212-121221121221
```


## Set resolution

In addition to the device address, this command also expect a resolution in one of the following forms
* `<width>x<height>`, `<width>-<height>`, `<width>*<height>` in which exact an exact match has to exists in available configurations,
* a number of megapixels (`3mp`, `0.439mp` ... or withouth the `mp` suffix). In this case, we try to find the closest configuration in terms of number of pixels

```
node index.js set_res -u myonvif_username -p password321 uuid:81111-1221-331212-121221121221 2mp
node index.js set_res -u myonvif_username -p password321 10.12.3.4 0.7mp
node index.js set_res -u myonvif_username -p password321 uuid:81111-1221-331212-121221121221 "720x576"
```
