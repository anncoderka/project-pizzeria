import { templates, select } from '../settings.js';
class Home {
    constructor(element, app) {
        const thisHome = this;
        thisHome.app = app;
        thisHome.render(element);
        thisHome.initActions();
        thisHome.initWidgets();

    }
    render(element) {
        const thisHome = this;
        const generatedHTML = templates.homeWidget();
        thisHome.dom = {};
        thisHome.dom.wrapper = element;
        thisHome.dom.wrapper.innerHTML = generatedHTML;
        thisHome.dom.homeHeader = thisHome.dom.wrapper.querySelector(select.home.homeHeader);
    }
    initActions() {
        const thisHome = this;
        thisHome.dom.homeHeader.addEventListener('click', function(event){
            event.preventDefault();
            let pageId = event.target.offsetParent.getAttribute('id-data');
            if (pageId) {
                thisHome.app.activatePage(pageId);
            }
        });
    }
    initWidgets() {
        const carouselElem = document.querySelector('.main-carousel');
        new Flickity(carouselElem, { /* eslint-disable-line */
          cellAlign: 'left',
          contain: true,
          prevNextButtons: false,
          autoPlay: true,
          wrapAround: true
        });
      }
}

export default Home;