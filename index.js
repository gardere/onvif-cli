const program = require('commander');

const { 
   getDeviceByHostname, 
   getDeviceByUrn, 
   getConfigurations, 
   connect, 
   reboot, 
   parseResolution, 
   getVideoEncoderConfigurationOptions,
   identifyConfigurationOptionForResolution,
   setVideoEncoderConfiguration
} = require('./utils');

program
   .command('reboot <urn>')
   .description('Reboot an OnVif compatible NVR')
   .option('-u, --username <username>', 'OnVif username')
   .option('-p, --password  <password>', 'OnVif password')
   .action(async(urn, {username, password}) => {
      const device = await getDeviceByUrn({
         urn,
         username,
         password
      });
      if (device) {
         console.log(`Device ${urn} found!`);
         await connect(device);
         await reboot(device);
         console.log('rebooting...');
         process.exit(0);
      } else {
         console.error(`Device ${urn} not found!`);
         process.exit(1);
      }
   });

const isUrn = address => address.startsWith('uuid:');

program
   .command('set_res <address> <resolution>')
   .description('Set a device\'s video encoder resolution')
   .option('-u, --username <username>', 'OnVif username')
   .option('-p, --password  <password>', 'OnVif password')
   .option('-t, --token  <configurationtoken>', 'OnVif configuration token')
   .option('-q, --quality  <quality>', 'Quality/resolution')
   .action(async(address, resolution, {username, password, configurationtoken, quality}) => {
      console.log('Looking for device...');
      
      const device = isUrn(address) ? await getDeviceByUrn({
         urn: address,
         username,
         password
      }) : await getDeviceByHostname({
         hostname: address,
         username,
         password
      });
      
      let resolutionObject;
      try {
         resolutionObject = parseResolution(resolution);
      } catch (err) {
         console.error(`Could not parse resolution ${resolution}:`, err);
         process.exit(1);
      }
      console.log('resolution parsed', resolutionObject);
      
      let configuration;
      if (device) {
         console.log(`Device ${address} found!`);
         await connect(device);
         console.log('connected');
         const configurations = await getConfigurations(device);
         if (configurationtoken && !configurations.find(configuration => configuration.$ && configuration.$.token === token)) {
            console.error('configuration not found');
            process.exit(1);
         } else if (!configurations.length) {
            console.error('no configurations found');
            process.exit(1);
         }  else if (!configurationtoken) {
            configurationtoken = configurations[0].$.token; 
         }
         configuration = configurations.find(configuration => configuration.$ && configuration.$.token === configurationtoken);

         console.log('Retrieving video encoder configuration options...');
         const confOptions = await getVideoEncoderConfigurationOptions(device);

         const selectedConfOption = identifyConfigurationOptionForResolution(confOptions, resolutionObject);
         if (!selectedConfOption) {
            console.error('No appropriate configuration found');
            process.exit(1);
         } else {
            configuration.resolution = selectedConfOption;
         }

         console.log(`updating configuration ${configurationtoken}`);
         try {
            configuration.quality = configuration.quality || quality;
            await setVideoEncoderConfiguration(device, configuration);
            console.log('configuration updated');
            process.exit(0);
         } catch(err) {
            console.error('error updating configuration', err);
            process.exit(1);
         }
      } else {
         console.error(`Device ${urn} not found!`);
         process.exit(1);
      }
   });

program.parse(process.argv);
