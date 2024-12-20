
function formatUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleString();
  }
  
  
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  
  function today(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day} 00:00:00`;
  }
  
  
  async function fetchTemperature() {
    try {
      const now = new Date();
      const nowFormatted = formatDate(now);
      const dateToday = new Date(now.getTime() - 24*7 * 60 * 60 * 1000);
      const dateTodayFormatted = formatDate(dateToday);
      const onlyToday = today(now);
    // Loading Data from the last 7 days
      const apiUrl = `https://api.ecowitt.net/api/v3/device/history?application_key=0D8C7C8B278C5E9469CD336E3B7F85CE&api_key=753bd0bd-4565-47d0-9873-d6b3dbef2428&mac=F0:08:D1:07:41:B8&start_date=${dateTodayFormatted}&end_date=${nowFormatted}&temp_unitid=1&pressure_unitid=5&wind_speed_unitid=6&rainfall_unitid=12&solar_irradiance_unitid=16&call_back=outdoor,wind,indoor&cycle_type=30min`;
  // check if fech sucessful
      if (!(await fetch(apiUrl)).ok) {
        throw new Error('Network response was not ok');
      }
      const data = await (await fetch(apiUrl)).json();
  
      // Extract temperature list and create temperature and time arrays of the last 7 days
      const temperatureList = Object.entries(data.data.outdoor.temperature.list)
        .filter(([_, value]) => value !== "")
        .map(([timestamp, value]) => ({ time: formatUnixTimestamp(timestamp), value: Number(value) }));
        
      const temperatureValues = temperatureList.map(item => item.value);
      const temperatureTimes = temperatureList.map(item => item.time);
  
      // Extract wind speed and gust data, similarly create value and time arrays of the last 7
      const windList = Object.entries(data.data.wind.wind_speed.list)
        .filter(([_, value]) => value !== "")
        .map(([timestamp, value]) => ({ time: formatUnixTimestamp(timestamp), value: Number(value) }));
  
      const windTimes = windList.map(item => item.time);
  
      const gustList = Object.entries(data.data.wind.wind_gust.list)
        .filter(([_, value]) => value !== "")
        .map(([timestamp, value]) => ({ time: formatUnixTimestamp(timestamp), value: Number(value) }));
  
      const gustTimes = gustList.map(item => item.time);
  
      const winddirList = Object.entries(data.data.wind.wind_direction.list)
      .filter(([_, value]) => value !== "")
      .map(([timestamp, value]) => ({ time: formatUnixTimestamp(timestamp), value: Number(value) }));
  
      const winddirValues = winddirList.map(item => item.value);
      const winddirTimes = winddirList.map(item => item.time); 

      // Below are the Plots
      const plotdata = [
        {
          x:temperatureTimes,
          y:temperatureValues,
          type: 'scatter',
          line: {color: '#17BECF'}
        }
      ];
  
      const winddata = [
        {
          x:gustTimes,
          y:gustList.map(item => item.value),
          type: 'scatter',
          line: {color: '#7F7F7F'}
        }
      ];
  
      const layoutTemperature = {
        title: '7d Outdoor Temperature',
        
        
        yaxis: {
          title: '°C',
          showline: true
        }
      };
  
      const layoutWind = {
        title: '7d Wind Speed',
        yaxis: {
          title: 'm/s',
          showline: true
        }
      };
  
      const layoutdir = {
        title: '7d Wind Direction',
        yaxis: {
          title: '°N',
          showline: true,
          range:[0,360]
        }
      };
      const trace1 = {
        x: winddirTimes,
        y: winddirValues,
        mode: 'markers',
        type: 'scatter',
        marker: { size: 5 }
      };
  
      var dataDir = [ trace1 ];
  
      Plotly.newPlot('myDiv', plotdata,layoutTemperature);
  
      Plotly.newPlot('myWind', winddata,layoutWind);
      
      Plotly.newPlot('windDirPlot', dataDir,layoutdir)

      
      // Calculate max and min values for temperature, wind, and gust

      const apiUrl24h = `https://api.ecowitt.net/api/v3/device/history?application_key=0D8C7C8B278C5E9469CD336E3B7F85CE&api_key=753bd0bd-4565-47d0-9873-d6b3dbef2428&mac=F0:08:D1:07:41:B8&start_date=${onlyToday}&end_date=${nowFormatted}&temp_unitid=1&pressure_unitid=5&wind_speed_unitid=6&rainfall_unitid=12&solar_irradiance_unitid=16&call_back=outdoor,wind,indoor`;
      if (!(await fetch(apiUrl24h)).ok) {
        throw new Error('Network response was not ok');
      }
      const data24h = await (await fetch(apiUrl24h)).json(); // Loaded Data fetch json

      // loading specific measurements (Outdoor temperature, Wind/gust speed)
      const temperatureList24h = Object.entries(data24h.data.outdoor.temperature.list) // Temperature List of this day
        .filter(([_, value]) => value !== "")
        .map(([timestamp, value]) => ({ time: formatUnixTimestamp(timestamp), value: Number(value) }));
      
      const windList24h = Object.entries(data24h.data.wind.wind_speed.list) // Wind speed list of today
        .filter(([_, value]) => value !== "")
        .map(([timestamp, value]) => ({ time: formatUnixTimestamp(timestamp), value: Number(value) }));

        const gustList24h = Object.entries(data24h.data.wind.wind_gust.list) // Gust list of today
        .filter(([_, value]) => value !== "")
        .map(([timestamp, value]) => ({ time: formatUnixTimestamp(timestamp), value: Number(value) }));
  
       
      
      const maxTemperature = Math.max(...temperatureList24h.map(item => item.value));
      const minTemperature = Math.min(...temperatureList24h.map(item => item.value));
      const maxWind = Math.max(...windList24h.map(item => item.value));
      const maxGust = Math.max(...gustList24h.map(item => item.value));

      // Max min of today
      document.getElementById('getTemp').textContent = `Today Max/Min Outdoor Temperature: ${maxTemperature}°C / ${minTemperature}°C`;
      document.getElementById('getWind').textContent = `Today Max Wind/Gust: ${maxWind} m/s / ${maxGust} m/s`;
  
  // Loading current data
        const apiUrlNow = `https://api.ecowitt.net/api/v3/device/real_time?imei=&call_back=all&temp_unitid=1&pressure_unitid=3&wind_speed_unitid=6&rainfall_unitid=12&solar_irradiance_unitid=16&application_key=0D8C7C8B278C5E9469CD336E3B7F85CE&api_key=753bd0bd-4565-47d0-9873-d6b3dbef2428&mac=F0:08:D1:07:41:B8`;
        const responseNow = await fetch(apiUrlNow);
        // check if fetch ok
        if (!responseNow.ok) {
          throw new Error('Network response was not ok');
        }

        const dataNow = await responseNow.json();
        const tempValueNow = dataNow.data.outdoor.temperature.value;
        const tempIndoorNow = dataNow.data.indoor.temperature.value;
        const windSpeedNow = dataNow.data.wind.wind_speed.value;
        const gustSpeedNow = dataNow.data.wind.wind_gust.value
        const windDirNow = dataNow.data.wind.wind_direction.value;
        //const GustDirNow = dataNow.data.wind.gust_direction.value;
        const timeData=formatUnixTimestamp(dataNow.data.outdoor.temperature.time);
  
        document.getElementById('time').textContent=`${timeData}`;
        document.getElementById('OutdoorNow').textContent=`Outdoor Temperature: ${tempValueNow} °C`;
        document.getElementById('IndoorNow').textContent=`Indoor Temperature: ${tempIndoorNow} °C`;
        document.getElementById('WindNow').textContent=`Wind (Gust): ${windSpeedNow} (${gustSpeedNow}) m/s from ${windDirNow} °N`;
  
  
  
    } catch (error) {
      console.error('Error fetching data:', error);
      document.getElementById('temperature-display').textContent = 'Error fetching temperature data';
    }
  }
  
  // Fetch temperature data every 10 seconds
  setInterval(fetchTemperature, 60000);
  
  // Initial fetch
  fetchTemperature();
  
  
  
