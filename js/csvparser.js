$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "./assets/out.csv",
        dataType: "text",
        success: function(data) {processData(data);}
     });
});

function processData(allText) {
    var allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[0].split(',');
    var lines = [];

    for (var i=1; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if (data.length == headers.length) {

            var tarr = [];
            for (var j=0; j<headers.length; j++) {
                tarr.push(headers[j]+":"+data[j]);
            }
            lines.push(tarr);
        }
    }    
    // aqui cargaremos las lineas en el mapa
    loadMap(lines);
}

function refine_interval(interval, cd, mask) {
    if (cd & mask) {
        interval[0] = (interval[0] + interval[1]) / 2;
    } else {
        interval[1] = (interval[0] + interval[1]) / 2;
    }
}


function decodeGeoHash(geohash) {
    var BITS = [16, 8, 4, 2, 1];
    var BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    var is_even = 1;
    var lat = [];
    var lon = [];
    lat[0] = -90.0;
    lat[1] = 90.0;
    lon[0] = -180.0;
    lon[1] = 180.0;
    var lat_err = 90.0;
    var lon_err = 180.0;
    for (var i = 0; i < geohash.length; i++) {
        var c = geohash[i];
        var cd = BASE32.indexOf(c);
        for (var j = 0; j < 5; j++) {
        var mask = BITS[j];
        if (is_even) {
            lon_err /= 2;
            refine_interval(lon, cd, mask);
        } else {
            lat_err /= 2;
            refine_interval(lat, cd, mask);
        }
        is_even = !is_even;
        }
    }
    lat[2] = (lat[0] + lat[1]) / 2;
    lon[2] = (lon[0] + lon[1]) / 2;        
    return [lat[2], lon[2]];
}

function rainbow(n) {
    n = n * 240 / 255;
    return 'hsl(' + n + ',100%,50%)';
}



function loadMap(lines){
        mymap = L.map('mapid').setView([39.48095740818392, -0.34156325567905377], 16);     
        //inicializamos el mapa
        var layerControl = false;
        //para que se vea la upv

        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 18,
                id: 'mapbox/satellite-v9',
                tileSize: 512,
                zoomOffset: -1,
                accessToken: 'sk.eyJ1IjoibGVvc2FtdSIsImEiOiJja2FjaW0weG0xZ3p6MnJwNHVvZmJ4eGs2In0.KYPRWmmdD_0gxO9dnGVY_A'
            }).addTo(mymap);
        var pisos = {};        
        if(layerControl === false) {
            layerControl = L.control.layers().addTo(mymap);
        }
        
        

        for (key in lines){            
            geohash = lines[key][1].split(":")[1].slice(1,-1);
            planta = lines[key][2].split(":")[1].slice(1,-1);            
            numUsuarios = lines[key][3].split(":")[1];            
            //poner un color por planta rainbow(1+30 por planta)            
                
            console.log('as');
            if (planta in pisos)
            {
                //si ya tenemos la planta agregamos el nodo
                nodo = setNode(geohash,numUsuarios,pisos[planta]['color'],pisos[planta]['fillcolor']);
                pisos[planta]['nodos'].push(nodo);
            }
            else{
                //sino creamos la planta
                //me falta asignar colores de una paleta
                var color = rainbow(Object.keys(pisos).length*30);
                var fillColor = rainbow(Object.keys(pisos).length*30);                
                pisos[planta] = {
                    'color':color,
                    'fillcolor':fillColor,
                    'nodos':[setNode(geohash,numUsuarios,color,fillColor)]
                 }                 
            }
        }        

        for (key in pisos)
        {
            layerControl.addOverlay(L.layerGroup(pisos[key]['nodos']), "Planta " + key);
        }        

        //agregamos las capas
        for (key in pisos)
        {
            mymap.addLayer(L.layerGroup(pisos[key]['nodos']));
        }                 
        crearSlider(mymap);
}

function setNode(geohash,size,color,fillcolor){
    
    if (size==15)
    console.log("anode");

    return L.circle(decodeGeoHash(geohash),{
        color: color,
        fillColor: fillcolor,
        fillOpacity: 0.5,
        radius: size
    });
}
   
function crearSlider(mymap){
    var slider = document.getElementById("miFiltro");
    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {    
    console.log('slider');
    var hidden = L.latLng(1000,1000);
    $("#personascelda")[0].innerText="Personas por celda de 100 metros cuadrados > " + this.value
    for (key in mymap._layers){
        if (!mymap._layers[key].path)
        {
            try {
                mymap._layers[key].path = mymap._layers[key].getLatLng();    
            } catch (error) {
                
            }   
        }
        if (mymap._layers[key]._mRadius && parseInt(mymap._layers[key]._mRadius)< parseInt(this.value))
        {
            try {
                mymap._layers[key].setLatLng( hidden);    
            } catch (error) {
                
            }
            
        }else{
            try {
                mymap._layers[key].setLatLng( mymap._layers[key].path);    
            } catch (error) {
                
            }
            
        }        
    }
    }
}
    
