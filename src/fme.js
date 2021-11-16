import Origo from 'Origo';
import {getArea} from 'ol/extent'; //FM+

const fme = function fme(options = {}) {
  const {
    title = 'Hämta data',
    destinationFormat = '', //FM+
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
  let extent_area; //FM+
  let extent_area_color; //FM+
  let fme_format; //FM+
  let fme_area; //FM+

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
    layerNames = layerNames.slice(0, -1);
    layerNames = layerNames.replace(/;/g, '%20');
    return layerNames;
  }

  function getExtent() {
    const map = viewer.getMap();
    const size = map.getSize();
    extent = map.getView().calculateExtent(size);
    extent.forEach((coordinate, j) => {
      extent[j] = Math.round(coordinate * 1) / 1;
    });
    extent = encodeURI(extent).replace(/,/g, '%20');
    return extent;
  }
  //FM B
  function getExtentArea() {
    const map = viewer.getMap();
    const size = map.getSize();
    extent = map.getView().calculateExtent(size);
    let extentarea = Math.round(getArea(extent) / 10000);
    return extentarea;
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
  let fmemaxarea =''
  function getMaxArea() {
    layers.forEach((el) => {
      if (el.getVisible() === true && el.get('fme')) {
            fmemaxarea = el.get('fmemaxarea');
      }
    });
    return fmemaxarea;
  }
  //FM E

  function appendDropdownFormat() {
    fme_format = getFormats(); //FM+
    const dropdown = document.getElementById('input-DestinationFormat');
    for (let i = 0; i < fme_format.length; i += 1) { //FM
      const opt = fme_format[i]; //FM
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
    let fmeUrl = options.url + format + layerName + extent;
    if (options.username) {
      fmeUrl += `&username=${localStorage.getItem('username')}`;
    }
    window.open(fmeUrl, '_self');
  }

  return Origo.ui.Component({
    name: 'fme',
    onInit() {
      fmeButton = Origo.ui.Button({
        cls: 'o-fme padding-small icon-smaller round light box-shadow',
        click() {
          layers = viewer.getLayers();
          layerTitle = getLayerTitle();
          //FM B
          extent_area = getExtentArea(); 
          fme_area = getMaxArea();
          if(extent_area > fme_area) {
            extent_area_color = 'red'
            }
          else {
            extent_area_color = 'green'
            }
            //FM E
          if (layerTitle) {
            content = `<br>Nedan listas de lager som kommer att hämtas från den aktuella vyn:<br><br><div id="fme-list">${layerTitle}</div><br>Max area: ${fme_area} ha<br><font color='${extent_area_color}'>Aktuell area: ${extent_area} ha</font><br><br>
                      <select id="input-DestinationFormat"><option>Välj format</option>
                      <input id="o-fme-download-button" type="button" value="Spara" disabled></input>`;
          } else {
            content = '<p style="font-style:italic;">Du måste tända ett nedladdningsbart lager i kartan för att kunna hämta data.</p>';
          }

          modal = Origo.ui.Modal({
            title,
            content,
            target: viewer.getId()
          });
          this.addComponent(modal);
          if (layerTitle) {
            appendDropdownFormat();

            document.querySelector('#input-DestinationFormat').addEventListener('change', () => {
              if (document.querySelector('#input-DestinationFormat').selectedIndex !== 0 && extent_area_color !== 'red') { //FM
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
        },
        icon,
        tooltipText: title,
        tooltipPlacement: 'east'
      });
    },

    onAdd(evt) {
      viewer = evt.target;
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      this.addComponents([fmeButton]);
      this.render();
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
