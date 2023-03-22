import { createBox } from 'ol/interaction/Draw.js';
import Origo from 'Origo';
import { getArea } from 'ol/extent';
import * as Extent from 'ol/extent';

const fme = function fme(options = {}) {
  const {
    title = 'Hämta data',
    destinationFormat = '', // FM+
  } = options;

  const icon = '#fa-download';
  let fmeButton;

  let viewer;
  let target;
  let modal;
  let content;
  let extent;
  let format;
  let layers;
  let layerName;
  let layerTitle;
  let map;
  let extent_area_color; // FM+
  let fme_format; // FM+
  let fme_area; // FM+
  let isActive = false; // FM+
  let drawInteraction; // FM+
  let selectSource; // FM+
  let sketch; // FM+
  let sketch_area; // FM+
  let radiusLengthTooltip; // FM+
  let radiusLengthTooltipElement; // FM+
  let geometryFunction; // FM+
  let drawn_box; // FM+
  let fmemaxarea = ''; // FM+
  let extent_fme; // FM+
  let fmeurl_custom = ''; // FM+

  // FMB - Start för utsökning med Box - Status för knappen
  function setActive(state) {
    isActive = state;
  }

  // FM - Funktion som körs när knappen blir aktiv
  function toggleselectiontool() {
    const detail = {
      name: 'fme',
      active: !isActive
    };
    isActive = !isActive;
    viewer.dispatch('toggleClickInteraction', detail);
    drawInteraction.setActive(true);
    map.on('pointermove', pointerMoveHandler);
  }

  // FM - Aktiverar knappen
  function enableInteraction() {
    setActive(true);
    document.getElementById(fmeButton.getId()).classList.add('active');
    addInteractions();
    console.log("Enable interaction");
  }

  // FM - Avaktiverar knappen
  function disableInteraction() {
    setActive(false);
    document.getElementById(fmeButton.getId()).classList.remove('active');
    removeInteractions();
    console.log("Disable interaction");
  }

  // FM - Startar rita box
  function addInteractions() {
    geometryFunction = createBox();
    drawInteraction = new Origo.ol.interaction.Draw({
      source: selectSource,
      type: 'Circle',
      geometryFunction: geometryFunction,
    });

    map.addInteraction(drawInteraction);

    drawInteraction.on('drawstart', (evt) => {
      sketch = evt.feature.getGeometry();
      createAreaTooltip();
      drawn_box = evt;

    });

    drawInteraction.on('drawend', (evt) => {
      fme_part()
    });

  }
  // FM - Avsluta rita box
  function removeInteractions() {
    map.removeInteraction(drawInteraction);
    removeAreaTooltip();
  }
  // FM - skapa hektar tooltip 
  function createAreaTooltip() {
    if (radiusLengthTooltipElement) {
      radiusLengthTooltipElement.parentNode.removeChild(radiusLengthTooltipElement);
    }

    radiusLengthTooltipElement = document.createElement('div');
    radiusLengthTooltipElement.className = 'o-tooltip o-tooltip-measure';

    radiusLengthTooltip = new Origo.ol.Overlay({
      element: radiusLengthTooltipElement,
      offset: [0, 0],
      positioning: 'bottom-center',
      stopEvent: false
    });

    map.addOverlay(radiusLengthTooltip);
  }

  // FM - Ta bort hektar tooltip 
  function removeAreaTooltip() {
    map.removeOverlay(radiusLengthTooltip);
    //  viewer.removeOverlays(overlayArray);
  }

  // FM - Uppdaterar tooltip 
  function pointerMoveHandler(e) {
    if (!sketch) return;
    sketch_area = Math.round(getArea(sketch.extent_) / 10000);
    radiusLengthTooltipElement.innerHTML = `${sketch_area} ha`;
    const sketch_extent = sketch.getExtent();
    const sketch_center = Extent.getCenter(sketch_extent);
    radiusLengthTooltip.setPosition([sketch_center[0], sketch_center[1]]);
  }

  // FMS - Utsökning med box klar
  // FMB - Modal ruta som visar valda parametrar (delar av koden nedan är utbytt ifrån orginal)
  function fme_part() {

    layers = viewer.getLayers();
    layerTitle = getLayerTitle();
    fme_area = getMaxArea();
    fmeurl_custom = getFmeUrlCustom();

    if (sketch_area > fme_area) {
      extent_area_color = 'red'
    }
    else {
      extent_area_color = 'green'
    }

    if (layerTitle) {
      content = `<br>Nedan listas de lager som kommer att hämtas från den aktuella vyn:<br><br><div id="fme-list">${layerTitle}</div><br>Max area: ${fme_area} ha<br><font color='${extent_area_color}'>Aktuell area: ${sketch_area} ha</font><br><br>
                        <select id="input-DestinationFormat"><option>Välj format</option>
                        <input id="o-fme-download-button" type="button" value="Spara" disabled></input>`;
    } else {
      content = '<p style="font-style:italic;">Du måste tända ett nedladdningsbart lager i kartan för att kunna hämta datas.</p>';
    }

    modal = Origo.ui.Modal({
      title,
      content,
      target: viewer.getId()
    });
    // this.addComponent(modal);
    // FMS
    if (layerTitle) {
      appendDropdownFormat();

      document.querySelector('#input-DestinationFormat').addEventListener('change', () => {
        if (document.querySelector('#input-DestinationFormat').selectedIndex !== 0 && extent_area_color !== 'red') { // FM+
          document.querySelector('#o-fme-download-button').removeAttribute('disabled');
        } else {
          document.querySelector('#o-fme-download-button').disabled = true;
        }
      });
      document.querySelector('#o-fme-download-button').addEventListener('click', () => {
        sendToFME();
        modal.closeModal();
      });
    }
  }

  function getLayerTitle() {
    let titles = '';
    layers.forEach((el) => {
      if (el.getVisible() === true && el.get('fme')) {
        titles += `<li>${el.get('title')}</li>`;
      }
    });
    return titles;
  }

  function getLayerName() {
    let layerNames = '';
    layers.forEach((el) => {
      if (el.getVisible() === true && el.get('fme')) {
        layerNames += `${el.get('name')};`;
      }
    });
    layerNames = layerNames.split(";").join("%20");
    return layerNames;
  }

  // FMB - (delar av koden nedan är utbytt ifrån orginal)
  function getExtent() {
    extent_fme = sketch.getExtent();
    extent_fme.forEach((coordinate, j) => {
      extent_fme[j] = Math.round(coordinate * 1) / 1;
    });
    extent_fme = encodeURI(extent_fme).replace(/,/g, '%20');
    return extent_fme;
  }

  function getFormats() {
    let fmeformat = '';
    layers.forEach((el) => {
      if (el.getVisible() === true && el.get('fme')) {
        fmeformat = el.get('fmeformat');
      }
    });
    return fmeformat;
  }

  function getMaxArea() {
    layers.forEach((el) => {
      if (el.getVisible() === true && el.get('fme')) {
        fmemaxarea = el.get('fmemaxarea');
      }
    });
    return fmemaxarea;
  }

  function getFmeUrlCustom() {
    layers.forEach((el) => {
      if (el.getVisible() === true && el.get('fme')) {
        fmeurl_custom = el.get('fmeurl');
      }
    });
    return fmeurl_custom;
  }
  // FMS

  function appendDropdownFormat() {
    fme_format = getFormats(); // FM+
    const dropdown = document.getElementById('input-DestinationFormat');
    for (let i = 0; i < fme_format.length; i += 1) { // FM
      const opt = fme_format[i]; // FM
      const el = document.createElement('option');
      el.textContent = opt;
      el.value = opt;
      dropdown.appendChild(el);
    }
  }

  function sendToFME() {
    format = document.getElementById('input-DestinationFormat');
    format = `&DestinationFormat=${format.options[format.selectedIndex].text}`;
    layerName = `&layer=${getLayerName()}`;
    extent = `&extent=${getExtent()}`;
    let fmeUrl;
    if (fmeurl_custom) { // FM+
      fmeUrl = fmeurl_custom + format + layerName + extent; // FM+
    }
    else {
      fmeUrl = options.url + format + layerName + extent;
    }
    if (options.username) {
      fmeUrl += `&username=${sessionStorage.getItem('username')}`; // FM+
    }
    window.open(fmeUrl, '_self');
  }

  return Origo.ui.Component({
    name: 'fme',
    onInit() {
      fmeButton = Origo.ui.Button({
        cls: 'o-fme padding-small icon-smaller round light box-shadow',
        click() {
          toggleselectiontool(this) // FM+

        },
        icon,
        tooltipText: title,
        tooltipPlacement: 'east'
      });
    },

    onAdd(evt) {
      viewer = evt.target;
      map = viewer.getMap();// Ny
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;

      selectSource = new Origo.ol.source.Vector({ wrapX: false });
      const Style = Origo.ol.style;

      this.addComponents([fmeButton]);
      this.render();

      viewer.on('toggleClickInteraction', (detail) => {
        if (detail.name === 'fme' && detail.active) {
          enableInteraction();
        } else {
          disableInteraction();
        }
      });

    },
    render() {
      const htmlString = fmeButton.render();
      const el = Origo.ui.dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      this.dispatch('render');
    }
  });
};

export default fme;