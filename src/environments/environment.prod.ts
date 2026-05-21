export const environment = {
  production: true,
  serverAddress: 'localhost',
  serverPort: '5000',
  enableDepthImageRoute: 'api/Tracking/SetDepthImagePreview/',
  startWebSocketsRoute: 'api/Network/StartBroadcast/',
  enablePointCloudImageRoute: 'api/Tracking/SetDepthImagePointCloudPreview',
  calibrationRoute:'api/Calibration/GetCalibrationMatrix',
  pointCloudHub: 'pointcloudhub',
  networkingConfig: {
    'address': 'localhost',
    'endPoint':'/ReFlex',
    'port':40001,
    'networkInterfaceType':1
  },
  depthImageRoute: 'depthImage',
  pointCloudImageRoute: 'depthImagePointCloud',
  websocketUrl: 'ws://localhost:40001/ReFlex',
  dataRepository: 'assets/data/data.json',
  settingsFile: 'assets/data/settings.json',
  keyConfigFile: 'assets/data/keybindings.json',
  textureResourceId: 6,
  maxTexture2dCount: 15,
  diagnosticsServerAddress: 'localhost',
  diagnosticsServerPort: 4302,
  sendDiagnosticsData: true
};
