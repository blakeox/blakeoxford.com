(() => {
  const params = new URLSearchParams(location.search);
  const mapParams = ['view','region','country','window','metric','election','district','party'];
  const mapAnchors = ['#atlas-methodology','#compare','#districts','#details','#map','#atlas-trail'];
  if (mapParams.some(key => params.has(key)) || mapAnchors.includes(location.hash)) {
    location.replace('/regional' + location.search + location.hash);
  }
})();
