import { select, settings, templates, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(element) {
        const thisBooking = this;
        thisBooking.selectedTable;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }
    getData (){
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.maxDate);

        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };
        const urls = {
            booking:        settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
            eventsCurrent:  settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
            eventsRepeat:   settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
        };
        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function(allResponses){
                const bookingResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];

                return Promise.all([
                    bookingResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }
    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;

        thisBooking.booked = {};

        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
        
        const minDate = thisBooking.datePickerWidget.minDate;
        const maxDate = thisBooking.datePickerWidget.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat == 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }
        thisBooking.updateDOM();
    }
    makeBooked(date, hour, duration, table) {
        const thisBooking = this;

        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }
        
        const startHour = utils.hourToNumber(hour);

        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }
            thisBooking.booked[date][hourBlock].push(table);
        }
    }
    updateDOM(){
        const thisBooking = this;

        thisBooking.date = thisBooking.datePickerWidget.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPickerWidget.value);

        let allAvailable = false;
        if (
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ) {
            allAvailable = true;
        }
        for(let table of thisBooking.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)){
                tableId = parseInt(tableId);
            }
            if (
                !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }
    render(element) {
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = document.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = document.querySelectorAll(select.booking.tables);
        thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);
        thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    }
    initWidgets() {
        const thisBooking = this;

        thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePickerWidget = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPickerWidget = new HourPicker(thisBooking.dom.hourPicker);
        
        thisBooking.dom.peopleAmount.addEventListener('click', function () {
            console.log('peopleAmount widget clicked');
            thisBooking.unselectTable();
        });
        thisBooking.dom.hoursAmount.addEventListener('click', function () {
            console.log('hoursAmount widget clicked');
            thisBooking.unselectTable();
        });
        thisBooking.dom.wrapper.addEventListener('updated', function () {
            thisBooking.unselectTable();
            thisBooking.updateDOM();
        });
        thisBooking.dom.floorPlan.addEventListener('click', function (event) {
            thisBooking.initTables(event);
        });
        thisBooking.dom.form.addEventListener('submit', function(event){
            event.preventDefault();
            thisBooking.sendBooking();
        });
    }
    unselectTable() {
        const thisBooking = this;
        for (let table of thisBooking.dom.tables) {
            table.classList.remove('selected');
        }
        thisBooking.selectedTable = 'undefined';
    }
    initTables(event) {
        const thisBooking = this;

        if (event.target.classList.contains('table')){
            const isTableBooked = event.target.classList.contains('booked');
            if (isTableBooked) {
                alert('Stolik niedostępny.');
            } else {
                const clickedTable = event.target.getAttribute('data-table');
                if (thisBooking.selectedTable == clickedTable) {
                    thisBooking.unselectTable();
                } else {
                    thisBooking.unselectTable();
                    event.target.classList.add('selected');
                    thisBooking.selectedTable = clickedTable;
                }
            }
        }
    }
    sendBooking() {
        const thisBooking = this;
        console.log('*** sendBooking ***');
        if (isNaN(thisBooking.selectedTable)) {
            alert('Please, select table first');
            return;
        }
        const url = settings.db.url + '/' + settings.db.booking;
        const payload = {
            date: thisBooking.datePickerWidget.value,
            hour: thisBooking.hourPickerWidget.value,
            table: parseInt(thisBooking.selectedTable),
            duration: thisBooking.hoursAmountWidget.value,
            ppl: thisBooking.peopleAmountWidget.value,
            starters: [],
            phone: thisBooking.dom.phone.value,
            address: thisBooking.dom.address.value,
        };
        for (let starter of thisBooking.dom.starters) {
            if (starter.checked) {
                payload.starters.push(starter.value);
            }            
        }
        console.log('payload:', payload);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };
        fetch(url, options)
            .then(function (response) {
                return response.json();
            }).then(function (parsedResponse) {
                console.log('parsedResponse', parsedResponse);
                thisBooking.makeBooked(
                    parsedResponse.date, 
                    parsedResponse.hour, 
                    parsedResponse.duration,
                    parsedResponse.table
                );
                thisBooking.unselectTable();
                thisBooking.updateDOM();
            });
    }
}

export default Booking;