# OnVif command line interface

Simple utility to interact with OnVif compatible devices.
2 commands are implemented for now: *reboot* and *set resolution*

Both commands expect a URN (without *urn:* prefix), a username and a password.

## Reboot

```
node index.js reboot -u myonvif_username -p password321 uuid:81111-1221-331212-121221121221
```


## Set resolution


```
node index.js set_res -u myonvif_username -p password321 uuid:81111-1221-331212-121221121221 2mp
node index.js set_res -u myonvif_username -p password321 uuid:81111-1221-331212-121221121221 0.7mp
node index.js set_res -u myonvif_username -p password321 uuid:81111-1221-331212-121221121221 "720x576"
```
