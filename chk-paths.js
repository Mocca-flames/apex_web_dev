const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/MauriX/Documents/apex_web';
const contentJson = JSON.parse(fs.readFileSync(ROOT + '/data/content.json','utf8'));
const contentMobile = JSON.parse(fs.readFileSync(ROOT + '/data/content_mobile.json','utf8'));

// Test get() simulation
function getKeys(obj, prefix='') {
  const results = [];
  for (const [k,v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      results.push('' + prefix + '.' + k + '.services');
      if (v && typeof v === 'object') {
        results.push(...getKeys(v, prefix+'.'+k));
      }
    }
  }
  return results;
}

// Directly test the paths
console.log('=== content.json top-level ===');
console.log('home keys:', Object.keys(contentJson.home));

console.log('\n=== content.json.serviceSection ===');
console.log('servicesSection exists:', !!contentJson.home.servicesSection);
const ss = contentJson.home.servicesSection;
console.log('  label:', ss?.label);
console.log('  heading:', ss?.heading);
console.log('  intro:', ss?.intro?.substring(0,60));
console.log('  services keys:', Object.keys(ss?.services || {}));
console.log('  services.count:', Object.keys(ss?.services || {}).length);

console.log('\n=== content.json.home.services ===');
const svcSection = contentJson.home.services;
console.log('services exists:', !!svcSection);
console.log('Type of services:', typeof svcSection, Array.isArray(svcSection) ? 'array' : 'object');
if (svcSection) {
  console.log('  hero:', svcSection.hero);
  console.log('  hero.eyebrow:', svcSection.hero?.eyebrow);
  console.log('  hero.heading:', svcSection.hero?.heading);
  console.log('  hero.sub:', svcSection.hero?.sub?.substring(0, 60));
  console.log('  serviceList keys:', Object.keys(svcSection.serviceList || {}));
}

console.log('\n=== content_mobile.json.serviceSection ===');
console.log('servicesSection exists:', !!contentMobile.home?.servicesSection);
const mss = contentMobile.home.servicesSection;
console.log('  label:', mss?.label);
console.log('  heading:', mss?.heading);
console.log('  intro:', mss?.intro?.substring(0,60));
console.log('  services:', Object.keys(mss?.services || {}));
