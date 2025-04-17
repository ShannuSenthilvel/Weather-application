const apiKey = '6adecd9c0913559ad047d8cba7a5eb2e'; // API key
const currentWeatherDiv = document.getElementById('current-weather');
const sunriseDiv = document.getElementById('sunrise');
const sunsetDiv = document.getElementById('sunset');
const errorMessageDiv = document.getElementById('error-message');
const forecastContainer = document.getElementById('forecast-container');
const searchContainer = document.getElementById('search-container');
const locationButton = document.getElementById('location-button');
const recentSearchesContainer = document.getElementById('recent-searches-container');
const recentCitiesDropdown = document.getElementById('recent-cities');

const currentWeatherUrl = 'https://api.openweathermap.org/data/2.5/weather';
const forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
const recentlySearchedCitiesKey = 'recentlySearchedCities';
let recentlySearchedCities = loadRecentlySearched();


// Function to load recently searched cities from local storage
function loadRecentlySearched() {
    const storedCities = localStorage.getItem(recentlySearchedCitiesKey);
    return storedCities ? JSON.parse(storedCities) : [];
}

// Function to save recently searched cities to local storage
function saveRecentlySearched() {
    localStorage.setItem(recentlySearchedCitiesKey, JSON.stringify(recentlySearchedCities));
    populateRecentSearchesDropdown();
}

// Function to populate the recently searched cities dropdown
function populateRecentSearchesDropdown() {
    recentCitiesDropdown.innerHTML = ''; // Clear previous options
    if (recentlySearchedCities.length > 0) {
        recentSearchesContainer.style.display = 'block';
        recentlySearchedCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            recentCitiesDropdown.appendChild(option);
        });
    } else {
        recentSearchesContainer.style.display = 'none';
    }
}

// Initial population of the dropdown on page load
populateRecentSearchesDropdown();

function displayError(message) {
    const errorMessageDiv = document.getElementById('error-message');
    if (errorMessageDiv) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.remove('hidden');
    } else {
        console.error("Error: 'error-message' div not found in HTML.");
    }
}

function clearWeatherInfo() {
    document.getElementById('temperature').textContent = '';
    document.getElementById('description').textContent = '';
    document.getElementById('humidity').textContent = '';
    document.getElementById('weather-icon').innerHTML = '';
    sunriseDiv.textContent = '';
    sunsetDiv.textContent = '';
}

//Function that displays the Current weather

function displayCurrentWeather(weatherData) {
    const temperatureCelsius = weatherData.main.temp.toFixed(1);
    const iconCode = weatherData.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const sunriseTimestamp = weatherData.sys.sunrise;
    const sunsetTimestamp = weatherData.sys.sunset;
    const sunriseTime = new Date(sunriseTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = new Date(sunsetTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cityNameElement = document.getElementById('city-name'); 

    if (cityNameElement) {
        cityNameElement.textContent = weatherData.name; // Display the city name
        console.log("City Name updated:", weatherData.name);
    }

    document.getElementById('temperature').textContent = `${temperatureCelsius}°C`;
    document.getElementById('description').textContent = weatherData.weather[0].description;
    document.getElementById('humidity').textContent = `Humidity: ${weatherData.main.humidity}%`;
    document.getElementById('weather-icon').innerHTML = `<img src="${iconUrl}" alt="Weather Icon">`;
    sunriseDiv.textContent = `Sunrise: ${sunriseTime}`;
    sunsetDiv.textContent = `Sunset: ${sunsetTime}`;
    errorMessageDiv.classList.add('hidden');
    updateWeatherUI(weatherData);
}

//Function that controls the animation of the wind turbine rotation

function updateWeatherUI(weatherData) {
    const windSpeedElement = document.getElementById('wind-speed-display');
    const propContainers = document.querySelectorAll('.turbine .prop-container'); // Select all prop-containers

    const windSpeedValue = weatherData.wind.speed;

    if (windSpeedElement) {
        windSpeedElement.textContent = `Wind Speed: ${windSpeedValue} m/s`;
    } else {
        console.error("Error: Element with ID 'wind-speed-display' not found.");
    }

    // Adjust animation duration based on wind speed
    propContainers.forEach(container => {
        let animationDuration = 5 - (windSpeedValue * 0.5); // Adjust multiplier for sensitivity
        if (animationDuration < 1) {
            animationDuration = 1; // Set a minimum speed
        }
        container.style.animationDuration = `${animationDuration}s`;
    });
}


function clearForecast() {
    forecastContainer.innerHTML = ''; // Clear the content of the forecast container
}

// Function to fetch weather data by city name
async function fetchWeatherData(city) {
    displayError(''); // Clear any previous errors

    const currentWeatherApiUrl = `${currentWeatherUrl}?q=${city}&appid=${apiKey}&units=metric`;
    const forecastApiUrl = `${forecastUrl}?q=${city}&appid=${apiKey}&units=metric`;
    

    console.log("currentWeatherUrl:", currentWeatherUrl);
    console.log("forecastUrl:", forecastUrl);
    
    try {
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            fetch(currentWeatherApiUrl),
            fetch(forecastApiUrl)
        ]);

        if (!currentWeatherResponse.ok || !forecastResponse.ok) {
            throw new Error('Could not fetch weather data.');
        }

        const currentWeatherData = await currentWeatherResponse.json();
        const forecastData = await forecastResponse.json();

        displayCurrentWeather(currentWeatherData);
        displayExtendedForecast(forecastData.list);
        updateRecentlySearched(currentWeatherData.name);

    } catch (error) {
        displayError('City not found or error fetching weather data.');
        console.error('Error fetching weather:', error);
        clearWeatherInfo();
        clearForecast();
    }
}
// Function to display extended forecast
function displayExtendedForecast(forecastList) {
    forecastContainer.innerHTML = ''; // Clear previous forecast
    const dailyForecast = {};

    //Group forecast data by day
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!dailyForecast[date]) {
            dailyForecast[date] = [];
        }
        dailyForecast[date].push(item);
    });

    // Display one forecast item per day (e.g., around noon)
    let dayCount = 0;
    for (const date in dailyForecast) {
        if (dayCount < 5) {
            const forecasts = dailyForecast[date];
            // Find a forecast around noon (you might need to adjust the time)
            const noonForecast = forecasts.find(item => {
                const hour = new Date(item.dt * 1000).getHours();
                return hour >= 11 && hour <= 13;
            }) || forecasts[0]; // If no noon forecast, take the first one

            if (noonForecast) {
                const dayName = new Date(noonForecast.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' });
                const temperature = noonForecast.main.temp.toFixed(1);
                const iconCode = noonForecast.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

                const forecastItem = document.createElement('div');
                forecastItem.classList.add('forecast-item');
                forecastItem.innerHTML = `
                    <h3>${dayName}</h3>
                    <div class="weather-icon"><img src="${iconUrl}" alt="Weather Icon"></div>
                    <p class="temperature">${temperature}°C</p>
                `;
                forecastContainer.appendChild(forecastItem);
                dayCount++;
            }
        }
    }
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        console.log("Geolocation is not supported by this browser.");
        errorMessageDiv.textContent = "Geolocation is not supported by this browser.";
        errorMessageDiv.classList.remove('hidden');
    }
}

// Function to fetch forecast data by coordinates
async function fetchForecastByCoords(latitude, longitude) {
    displayError('');
    const forecastApiUrl = `${forecastUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

    try {
        const forecastResponse = await fetch(forecastApiUrl);

        if (!forecastResponse.ok) {
            throw new Error('Could not fetch forecast data.');
        }

        const forecastData = await forecastResponse.json();
        displayExtendedForecast(forecastData.list);

    } catch (error) {
        displayError('Error fetching forecast data for your location.');
        console.error('Error fetching forecast by coords:', error);
        clearForecast();
    }
}

// Function to fetch weather data by coordinates
async function fetchWeatherByCoords(latitude, longitude) {
    displayError('');
    const currentWeatherApiUrl = `${currentWeatherUrl}?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

    try {
        const currentWeatherResponse = await fetch(currentWeatherApiUrl);

        if (!currentWeatherResponse.ok) {
            throw new Error('Could not fetch current weather data.');
        }

        const currentWeatherData = await currentWeatherResponse.json();
        displayCurrentWeather(currentWeatherData);
        updateRecentlySearched(currentWeatherData.name);

    } catch (error) {
        displayError('Error fetching current weather data for your location.');
        console.error('Error fetching current weather by coords:', error);
        clearWeatherInfo();
    }
}

//Function that updates the recently searched dropdown

function updateRecentlySearched(cityName) {
    if (!recentlySearchedCities.includes(cityName)) {
        recentlySearchedCities.unshift(cityName); 
        if (recentlySearchedCities.length > 5) {
            recentlySearchedCities.pop(); 
        }
        saveRecentlySearched(); 
    }
}


function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    fetchWeatherByCoords(latitude, longitude);
    fetchForecastByCoords(latitude, longitude);
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.log("User denied the request for Geolocation.");
            errorMessageDiv.textContent = "Please enable location services to get weather information.";
            errorMessageDiv.classList.remove('hidden');
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable.");
            errorMessageDiv.textContent = "Location information is currently unavailable.";
            errorMessageDiv.classList.remove('hidden');
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out.");
            errorMessageDiv.textContent = "Request to get location timed out.";
            errorMessageDiv.classList.remove('hidden');
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown error occurred.");
            errorMessageDiv.textContent = "An unknown error occurred while fetching location.";
            errorMessageDiv.classList.remove('hidden');
            break;
    }
}


//Function that handles the background update based on the current time

function updateBackground() {
    console.log("updateBackground() called");
    const now = new Date();
    const hours = now.getHours();
    const backgroundDiv = document.getElementById('page-background');
    const sunMoonContainer = document.getElementById('sun-moon-container');
    sunMoonContainer.innerHTML = ''; 
    if (hours >= 6 && hours < 18) { // Morning (6 AM to 5:59 PM)
        if (backgroundDiv) {
            backgroundDiv.className = 'background morning-gradient';
        }
        //Adding a simple sun
        const sun = document.createElement('div');
        sun.className = 'sun';
        sunMoonContainer.appendChild(sun);
    } else { // Night (6 PM to 5:59 AM)
        if (backgroundDiv) {
            backgroundDiv.className = 'background night-gradient';
            const moon = document.createElement('div');
            moon.className = 'moon';
            moon.style.position = 'absolute';
            moon.style.top = '15%';
            moon.style.left = '10%';
            moon.style.width = '60px';
            moon.style.height = '60px';
            moon.style.backgroundColor = 'lightgray';
            moon.style.borderRadius = '50%';
            moon.style.boxShadow = '0 0 20px white';
            sunMoonContainer.appendChild(moon);

            // Adding some simple stars
            const numStars = 100;
            for (let i = 0; i < numStars; i++) {
              const star = document.createElement('div');
              star.className = 'star';
              star.style.top = Math.random() * 100 + '%';
              star.style.left = Math.random() * 100 + '%';
              star.style.width = Math.random() * 3 + 1 + 'px';
              star.style.height = star.style.width;
              star.style.opacity = Math.random() * 0.8 + 0.2;
              sunMoonContainer.appendChild(star);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const cityInput = document.getElementById('city-input');

    cityInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });

    searchButton.addEventListener('click', () => {
        console.log("Search button clicked (DEFINITELY)");
        console.log("Inside search button click listener");
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
            cityInput.value = ''; // Clear input after search
        } else {
            displayError('Please enter a city name.');
        }
    });

    getLocation();
    updateBackground();
    setInterval(updateBackground, 60000);
});