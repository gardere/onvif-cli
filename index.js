const program = require('commander');

const { 
   getDevice, 
   getConfigurations, 
   connect, 
   reboot, 
   parseResolution, 
   getVideoEncoderConfigurationOptions,
   identifyConfigurationOptionForResolution,
   setVideoEncoderConfiguration
} = require('./utils');

program
   .command('reboot <address>')
   .description('Reboot an OnVif compatible NVR')
   .option('-u, --username <username>', 'OnVif username')
   .option('-p, --password  <password>', 'OnVif password')
   .action(async(address, {username, password}) => {
      const device = await getDevice({
         address,
         username,
         password
      });

      if (device) {
         console.log(`Device ${address} found!`);
         try {
            await connect(device);
            await reboot(device);
            console.log('rebooting...');
            process.exit(0);
         } catch(err) {
            console.error('error rebooting device', err);
            process.exit(1);
         }
      } else {
         console.error(`Device ${address} not found!`);
         process.exit(1);
      }
   });

program
   .command('set_res <address> <resolution>')
   .description('Set a device\'s video encoder resolution')
   .option('-u, --username <username>', 'OnVif username')
   .option('-p, --password  <password>', 'OnVif password')
   .option('-t, --token  <configurationtoken>', 'OnVif configuration token')
   .option('-q, --quality  <quality>', 'Quality/resolution')
   .action(async(address, resolution, {username, password, configurationtoken, quality}) => {
      console.log('Looking for device...');
      
      const device = await getDevice({
         address,
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
      
      let configuration;
      if (device) {
         console.log(`Device ${address} found!`);
         await connect(device);
         console.log('Connected');
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

         console.log(`Updating configuration ${configurationtoken}`);
         try {
            configuration.quality = configuration.quality || quality;
            await setVideoEncoderConfiguration(device, configuration);
            console.log('Configuration updated!');
            process.exit(0);
         } catch(err) {
            console.error('Error updating configuration', err);
            process.exit(1);
         }
      } else {
         console.error(`Device ${address} not found!`);
         process.exit(1);
      }
   });

program.parse(process.argv);
