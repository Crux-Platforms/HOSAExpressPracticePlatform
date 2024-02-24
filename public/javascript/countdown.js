var countDownDate = new Date("May 09, 2024 00:00:00").getTime();
const monthsElement = document.getElementById('month');
const daysElement = document.getElementById('day');
const hoursElement = document.getElementById('hour');
const minutesElement = document.getElementById('minute');
const secondsElement = document.getElementById('second');

var x = setInterval(function () {

    let today = new Date().getTime();

    let interval = countDownDate - today;

    let months = Math.floor(interval / (1000 * 60 * 60 * 24 * 30))
    let days = 30 % Math.floor(interval / (1000 * 60 * 60 * 24));
    let hours = Math.floor((interval % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((interval % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((interval % (1000 * 60)) / 1000);

    monthsElement.innerHTML = months;
    daysElement.innerHTML = days;
    hoursElement.innerHTML = hours;
    minutesElement.innerHTML = minutes;
    secondsElement.innerHTML = seconds;

    if (interval < 0) {
        clearInterval(x);
        document.getElementById("new").innerHTML = "HAPPY NEW YEAR ! TIME FOR A NEW BEGINNING";
    }
}, 1000);
