const onvif = require('onvif');

const isUrn = address => address.startsWith('uuid:');

const getDevice = async ({
   address,
   username,
   password
}) => {
   return isUrn(address) ? await getDeviceByUrn({
      urn: address,
      username,
      password
   }) : await getDeviceByHostname({
      hostname: address,
      username,
      password
   });
}

const getDeviceByUrn = async ({ urn, username, password }) => {
   return new Promise((resolve, reject) => onvif.Discovery.probe({timeout: 2000, resolve: true}, (error, devices) => {
      if (error) {
        reject(error);
      } else {
         const device = devices.find(device => device.urn.toLocaleLowerCase() === urn.toLocaleLowerCase());
         if (device && username && password) {
            device.username = username;
            device.password = password;
         }
         resolve(device);
      }
   }));
}

const getDeviceByHostname = async({ hostname, username, password }) => {
   return new onvif.Cam({
      hostname, 
      username, 
      password
   });
}

const reboot = device => new Promise((resolve, reject) => { 
   try {
      device.systemReboot((err) => {
         if (err) { 
            reject(err);
         } else {
            resolve();
         }
      }); 
   } catch (err) {
      reject(err);
   }
});

const connect = device => {
   return new Promise((resolve, reject) => {
      device.once('connect', resolve);
      device.on('error', err => console.error('error occured whilst connecting', err));
      device.connect((err, result, xml) => {
         if (err) {
            reject(err);
         }
      });
   });
};

const getConfigurations = (device) => {
   return new Promise((resolve, reject) => {
      device.getVideoEncoderConfigurations((err, configurations) => {
         if (err) {
            reject(err);
         } else {
            resolve(configurations);
         }
      });
   });
};

const getVideoEncoderConfigurationOptions = (device) => {
   return new Promise((resolve, reject) => {
      device.getVideoEncoderConfigurationOptions((err, options) => {
         if (err) {
            reject(err);
         } else {
            resolve(options);
         }
      });
   });
};

const parseResolution = str => {
   const regexp1 = /^([0-9]+)[\*\-x]([0-9]+)$/;   // 1024x768 or 1024*768 or 1024-768
   const regexp2 = /^([0-9]+\.?[0-9]*)mp+$/i;      // 1.45mp or 4mp
   const regexp3 = /^([0-9]+([.|,][0-9]+)?)$/;    // number only

   if (regexp1.test(str)) {
      const [_, width, height] = str.match(regexp1).map(a => parseInt(a, 10));
      return { width, height };
   } else if (regexp2.test(str)) {
      return { res_mp: parseInt(str.match(regexp2)[1], 10) };
   } else if (regexp3.test(str)) {
      return { res_mp: parseInt(str.match(regexp3)[1], 10) };
   } else {
      throw new Error('Could not parse resolution');
   }
};

const identifyConfigurationOptionForResolution = (confOptions, requestedRes) => {
   if (requestedRes.width && requestedRes.height) {
      return confOptions.H264.resolutionsAvailable.find(res => res.width === requestedRes.width && res.height === requestedRes.height);
   } else {
      return confOptions.H264.resolutionsAvailable.reduce((result, resolution) => {
         if (result) {
            const currentResultMps = result.width * result.height;
            const thisResMps = resolution.width * resolution.height;
            if (Math.abs(currentResultMps - requestedRes.res_mp*1000000) < Math.abs(thisResMps - requestedRes.res_mp*1000000)) {
               return result;
            } else {
               return resolution;
            }
         } else {
            return res;
         }
      });
   }
};

const setVideoEncoderConfiguration = (device, configuration) => {
   return new Promise((resolve, reject) => {
      device.setVideoEncoderConfiguration(configuration, (err) => {
         if (err) {
            reject(err);
         } else {
            resolve();
         }
      })
   })
};

module.exports = { 
   getDevice, 
   getConfigurations,
   connect,
   reboot,
   parseResolution,
   getVideoEncoderConfigurationOptions,
   identifyConfigurationOptionForResolution,
   setVideoEncoderConfiguration
};
