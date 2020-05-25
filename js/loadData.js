$(document).ready(function() {
  // si tengo parametro hora
  if (typeof hora === 'undefined') 
  {   
    var coeff = 1000 * 60 * 5;
    var date = new Date();  //or use any other date
    hora = new Date(Math.round(date.getTime() / coeff) * coeff).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    loadMap(datos,hora);    
  }  
  else
    loadMap(datos,hora);  
  crearSlider(mymap);
});

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

function loadMap(datos,hora){        
        if  (typeof mymap === 'undefined') 
        {
            //inicializamos el mapa
            //si tengo parametro edificio centrar el mapa en el edificio
            if (typeof edificio != 'undefined'){
                mymap = L.map('mapid').setView(decodeGeoHash(edificio["geohash"]), 20);     
            }
            else{
                //sino si tengo parametro campus centrar mapa en el campus A,G,V
                if (typeof campus != 'undefined'){
                    if (campus =="A"){
                        mymap = L.map('mapid').setView([38.6944387,-0.4782071], 16);     
                    }else if (campus =="G"){
                        mymap = L.map('mapid').setView([ 38.9962585,-0.166243], 16);     
                    }else{
                        mymap = L.map('mapid').setView([39.48095740818392, -0.34156325567905377], 16);             
                    }
                }else{
                    mymap = L.map('mapid').setView([39.48095740818392, -0.34156325567905377], 16);             
                }

            }
            
            //gandia 38.9962585,-0.166243,19z
            //alcoi 38.6944387,-0.4782071,893m
            //sino centrar el mapa en valencia
            
            //mymap = L.map('mapid').setView([39.48095740818392, -22.55156325567905377], 16);     
        }
        else{
            //limpiamos los puntos y volvemos a pintar
            mymap.eachLayer(function(layer) {
                if (!!layer.toGeoJSON) {
                  mymap.removeLayer(layer);
                }
              });
            //quitamos el control del layer y dejamos leyenda fija lo dejo comentado por si acaso
            //layerControl.remove()    
        }
        
        //inicializamos el mapa
        //quitamos el control del layer y dejamos leyenda fija lo dejo comentado por si acaso
        //layerControl = false;
        //para que se vea la upv
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 18,
                id: 'mapbox/satellite-v9',
                tileSize: 512,
                zoomOffset: -1,
                accessToken: 'sk.eyJ1IjoibGVvc2FtdSIsImEiOiJja2FjaW0weG0xZ3p6MnJwNHVvZmJ4eGs2In0.KYPRWmmdD_0gxO9dnGVY_A'
            }).addTo(mymap);
        
        
        datoshora = datos[hora];
        if  (typeof datoshora != 'undefined') 
        {
            $($(".alerta")[0]).css("display","none");
        }
        else{
            $($(".alerta")[0]).css("display","block");
        }

        if  (typeof mymap === 'undefined') 
        {

        }
        else{
            //quitamos el control del layer y dejamos leyenda fija lo dejo comentado por si acaso
            //if(layerControl === false) {
            //    layerControl = L.control.layers().addTo(mymap);
            //}
            // necesito un layer para cada key en datoshora -> un layer por densidad
            //vamos a tener 2 franjas actualmente si se decide cambiar para que sea variable
            //las cargaremos abajo y pintar pasara a ser = {} en esta declaración
            var pintar = {"d80":{"color":"yellow","fillcolor":"yellow","nodos":[]},
                          "d100":{"color":"red","fillcolor":"red","nodos":[]}    
                         }
            //preparamos los layers en pintar
        for (key in datoshora){
            if (key in pintar)
            {
            for (datonodo in datoshora[key])
            {
                //si ya tenemos la planta agregamos el nodo
                //key es el % de ocupacion                            
                nodo = setNode(datoshora[key][datonodo]["geohash"],datoshora[key][datonodo]["edificio"],datoshora[key][datonodo]["planta"],parseInt(key.replace("d","")),pintar[key]['color'],pintar[key]['fillcolor']);
                pintar[key]['nodos'].push(nodo);
            }             
            }
            else{

                /*
                esto solo me hará falta si decidimos que los rangos en lugar de ser 80 y 100 sean variables
                var color = rainbow(Object.keys(pisos).length*30);
                var fillColor = rainbow(Object.keys(pisos).length*30);                
                pintar[key] = {
                    'color':color,
                    'fillcolor':fillColor,
                    'nodos':[setNode(geohash,numUsuarios,color,fillColor)]
                 }*/     
                 /*
                 esto solo me hará falta si hay que pintar la leyenda
                 var style = document.createElement('style');
                style.innerHTML = `
                label:nth-child(` + Object.keys(pisos).length.toString() + `) > div > span{
                    color:`+ color +`;
                }
                `;
                document.head.appendChild(style);*/
            }             
        }

        //quitamos el control del layer y dejamos leyenda fija lo dejo comentado por si acaso
        //for (key in pintar)
        //{
        //    layerControl.addOverlay(L.layerGroup(pintar[key]['nodos']), "Densidad: " + key + "%");
        //}        
        //layerControl.expand();
        //$(".leaflet-control-layers-overlays label input").trigger('click');
        for (key in pintar)
        {
            mymap.addLayer(L.layerGroup(pintar[key]['nodos']));
        }
        }                        
}

function setNode(geohash,edificio,planta,size,color,fillcolor){
    return L.circle(decodeGeoHash(geohash),{
        color: color,
        fillColor: fillcolor,
        fillOpacity: 0.5,
        radius: size/5
    }).bindPopup("Ed. " + edificio + " Planta" + planta );
}
   
function crearSlider(mymap){
    var slider = document.getElementById("miFiltro");        
    if  (typeof hora != 'undefined') 
        {   
            slider.value = parseInt(hora.split(":")[0])*12+Math.round(parseInt(hora.split(":")[1])/5)
            $("#personascelda")[0].innerText="Personas por celda de 100 metros cuadrados a las " + hora;
        }
    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {    
    var horas = Math.floor(this.value/12)
    var minutos = Math.floor(this.value%12*5)
    var momento = new Date();
    momento.setHours(horas);
    momento.setMinutes(minutos);    
    var today = new Date();    
    //el slider da valores numéricos de 1 a 288 que son los rangos de 5 en 5 minutos
    $("#personascelda")[0].innerText="Personas por celda de 100 metros cuadrados a las " + momento.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " el día " + today.getDate() + "-"+ today.getMonth()+ "-" + today.getFullYear();
    loadMap(datos,momento.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    /*
    var hidden = L.latLng(1000,1000);
    
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
    }*/
    }
}
    
