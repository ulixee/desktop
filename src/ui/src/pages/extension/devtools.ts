/// <reference types="chrome"/>

(window as any).cloudAddressPromise = new Promise<string>(resolve => {
  chrome.devtools.inspectedWindow.eval('cloudAddress', (address: string, error) => {
    console.log('Got cloud address', address);
    resolve(address);
  });
});

function onPanel(extensionPanel) {
  extensionPanel.onShown.addListener(async panelWindow => {
    const cloudAddress = await (window as any).cloudAddressPromise;
    panelWindow.setCloudAddress(cloudAddress);
  });
  return null;
}

chrome.devtools.panels.create('Hero Script', '', '/extension/hero-script.html', onPanel);
chrome.devtools.panels.create('Resources', '', '/extension/resources.html', onPanel);
chrome.devtools.panels.create('State Generator', '', '/extension/state-generator.html', onPanel);
