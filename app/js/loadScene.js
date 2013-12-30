require([
	'goo/entities/GooRunner',
	'goo/statemachine/FSMSystem',
    'goo/renderer/Camera',
    'goo/entities/EntityUtils',
	'goo/addons/howler/systems/HowlerSystem',
    'goo/scripts/OrbitCamControlScript',
    'goo/entities/components/ScriptComponent',
	'goo/loaders/DynamicLoader',
    'goo/math/Vector3',
    'goo/math/Vector2',
    'lib/hammer.min',
    'goo/shapes/ShapeCreator',
    'goo/renderer/Material',
	'goo/renderer/TextureCreator',
    'goo/renderer/shaders/ShaderLib',
     'goo/entities/systems/PickingSystem',
        'goo/picking/PrimitivePickLogic',
        'goo/math/Ray'
], function (
	GooRunner,
	FSMSystem,
    Camera,
    EntityUtils,
	HowlerSystem,
    OrbitCamControlScript,
    ScriptComponent,
	DynamicLoader,
    Vector3,
    Vector2,
    hammer,
    ShapeCreator,
    Material,
    TextureCreator,
    ShaderLib,
     PickingSystem,
        PrimitivePickLogic,
        Ray
    
    
) {
	'use strict';
    //JAVI -> esta funcion la usaremos en su debido momento para calcular donde podemos poner los bonuses, si sabemos hacerlos
    function getCoordinatesNotOccupiedByWalls(){
        return {
            x: -20,
            z: -20,
            y: 0
        }
    }
	function init() {
        
		// If you try to load a scene without a server, you're gonna have a bad time
		if (window.location.protocol==='file:') {
			alert('You need to run this webpage on a server. Check the code for links and details.');
			return;
		}

		// Make sure user is running Chrome/Firefox and that a WebGL context works
		var isChrome, isFirefox, isIE, isOpera, isSafari, isCocoonJS;
		isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
			isFirefox = typeof InstallTrigger !== 'undefined';
			isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
			isChrome = !!window.chrome && !isOpera;
			isIE = false || document.documentMode;
			isCocoonJS = navigator.appName === "Ludei CocoonJS";
		if (!(isFirefox || isChrome || isSafari || isCocoonJS || isIE === 11)) {
			alert("Sorry, but your browser is not supported.\nGoo works best in Google Chrome or Mozilla Firefox.\nYou will be redirected to a download page.");
			window.location.href = 'https://www.google.com/chrome';
		} else if (!window.WebGLRenderingContext) {
			alert("Sorry, but we could not find a WebGL rendering context.\nYou will be redirected to a troubleshooting page.");
			window.location.href = 'http://get.webgl.org/troubleshooting';
		} else {

			// Preventing brower peculiarities to mess with our control
			document.body.addEventListener('touchstart', function(event) {
				event.preventDefault();
			}, false);
			// Loading screen callback
			var progressCallback = function (handled, total) {
				var loadedPercent = (100*handled/total).toFixed();
				var loadingOverlay = document.getElementById("loadingOverlay");
				var progressBar = document.getElementById("progressBar");
				var progress = document.getElementById("progress");
				var loadingMessage = document.getElementById("loadingMessage");
				loadingOverlay.style.display = "block";
				loadingMessage.style.display = "block";
				progressBar.style.display = "block";
				progress.style.width = loadedPercent + "%";
			};

			// Create typical Goo application
			var goo = new GooRunner({
				antialias: true,
				manuallyStartGameLoop: true
			});
			var fsm = new FSMSystem(goo);
			goo.world.setSystem(fsm);
			goo.world.setSystem(new HowlerSystem());
            
            //JAVI -> Aqui hay un poco de codigo nuestro, lo anterior es de goo
            var intersectionWithFloor;
            //JAVI -> esto es para detectar cuando "pickeas" o clickas en algo con un "Ray" de lo que te conte en el mail
            var picking = new PickingSystem({pickLogic: new PrimitivePickLogic()});
            goo.world.setSystem(picking); 
            //Cuando detecta que se pickea algo te devuelve el result
            picking.onPick = function(result){
                console.log(result);
                if(result.length>0){
                    //En el array de result estan todos los objetos que toca, he puesto el 0 siempre
                    // Pero habrá que mirara aqui cual es el que toca, puede ser que el 0 sea un muro o un Goon
                    intersectionWithFloor = result[0].intersection.points[0];
                }else{
                    //Si no toca con nada es que estamos tocando fuera del mapa
                    intersectionWithFloor = false;
                }
            };
            //JAVI -> Para guardar las coordenadas del raton , ahora no se usar, pero lo tenemos que usar
            //Cuando hagamos lo de actualizarlas cuando se mueva el raton
            //Vector2 es un objecto con propiedades x, y
            var Input = {};
            Input.mousePosition = new Vector2();
            var isClicking = false;
            goo.ray = new Ray();      
            //Cast a ray that intersects, using the picking system
            goo.castRay = function(ray, mask, all){
                picking.pickRay = ray;
                picking.mask = mask;
                picking.all = all;
                picking._process();
                //return picking.hit;
            };
            //Prevent modifying the ray object
            Object.freeze(goo.castRay);
            
            goo.world.process();
			// The loader takes care of loading the data
			var loader = new DynamicLoader({
				world: goo.world,
				rootPath: 'res',
				progressCallback: progressCallback});

			loader.loadFromBundle('project.project', 'root.bundle', {recursive: false, preloadBinaries: true}).then(function(configs) {

				// This code will be called when the project has finished loading.
				goo.renderer.domElement.id = 'goo';
				document.body.appendChild(goo.renderer.domElement);

				//Application code goes here! En el configs viene todo lo cargado del fichero root.bundle
                console.log(configs)
                
                //Funcion para crear entidades lo usaremos para crear diamantes o bonuses que se puedan pickear
                // De momento no se usa mas que para crear unos planetas que salen por ahi
                var tc = new TextureCreator()
                var bonusTex = tc.loadTexture2D('images/earth.jpg');
                
                function createBonus(radius, texture) {
                    var meshData = ShapeCreator.createSphere(24, 24, radius);
                    var material = Material.createMaterial(ShaderLib.uber);
                    material.setTexture('DIFFUSE_MAP', texture);
                    var entity = EntityUtils.createTypicalEntity(goo.world, meshData, material, {
                        run: function (entity) {
                            entity.transformComponent.setRotation( 0, goo.world.time * 0.5, 0);
                        }
                    });
                    
                    var coords = getCoordinatesNotOccupiedByWalls();
                    entity.transformComponent.transform.translation.x = 0;
                    entity.transformComponent.transform.translation.y = coords.y;
                    entity.transformComponent.transform.translation.z = coords.z;
                    entity.addToWorld();
                    return entity;
                }
                for(var i = 0; i<5; i++){
                    createBonus(1, bonusTex);
                }
                
   
                //Obtenemos la entidad del muñeco, del fichero root.bundle
                var goonEntity = loader.getCachedObjectForRef('goon_bind_1/entities/RootNode.entity');
                var scripts = new ScriptComponent();
                scripts.scripts.push({run:function(entity, tpf){
                   if(isClicking && intersectionWithFloor){
                        
                        var trans = entity.transformComponent.transform.translation;
                        if(trans.x < intersectionWithFloor.x){
                            trans.x +=  goo.world.tpf * 15;
                        }else if(trans.x > intersectionWithFloor.x){
                            trans.x -=  goo.world.tpf * 15;
                        }
                        if(trans.z < intersectionWithFloor.z){
                            trans.z += goo.world.tpf * 15;
                        }else if(trans.z > intersectionWithFloor.z){
                            trans.z -=  goo.world.tpf * 15;
                        } 
                        console.log(entity);
                        
                        entity.animationComponent.transitionTo(entity.animationComponent.getStates()[1]);
                        entity.transformComponent.lookAt(intersectionWithFloor,new Vector3(0,1,0));
                       //console.log(entity.meshRendererComponent.worldBound.intersects);
                        //goonEntity.transformComponent.transform.translation.lerp(new Vector3(intersectionWithFloor.x,0,intersectionWithFloor.z ), goo.world.tpf*5);
                        // update the new transforms
                        entity.transformComponent.setUpdated();
                        
                    }else if(!isClicking){
                        entity.animationComponent.transitionTo(entity.animationComponent.getStates()[0]);
                    
                    }
                }});
                goonEntity.setComponent(scripts);
                

                //Decimos que viewCam es la entidad camera entity del root bundle ( definida en goo create)
                goo.viewCam = loader.getCachedObjectForRef('entities/Camera_0.entity');
      
                //Decimos que cada vez que se haga el loop se ejecute lo de dentro de aqui
                goo.callbacks.push(function() {
                    
                    
                });

                
                var element = document.getElementById('goo');
                var hammertime = Hammer(element).on("touch", function(ev) {
                    ev.gesture.preventDefault()
                    isClicking = true;
                    //Creamos el rayo para determinar el punto donde tocamos
                    goo.viewCam.cameraComponent.camera.getPickRay(
                        ev.gesture.center.pageX,
                        ev.gesture.center.pageY,
                        goo.renderer.viewportWidth,
                        goo.renderer.viewportHeight,
                        goo.ray
                    );
                    goo.castRay(goo.ray, 1);
                    
                });
                //deja de mover al soltar
                hammertime.on('release', function(){
                    isClicking = false;
                });


				goo.startGameLoop();

			}).then(null, function(e) {
				// If something goes wrong, 'e' is the error message from the engine.
				alert('Failed to load scene: ' + e);
			});

		}
	}

	init();
});

//UTILS
/*
//Add a function that executes every game loop
 goo.callbacks.push(function() {
    //Whatever
});

*/

/* 
//Add a function that executes every loop to a entity
var scripts = new ScriptComponent();
scripts.scripts.push({run:function(entity, tpf){
   entity.transformComponent.setTranslation( -18-(20*tpf), 0, 21);
}});
goonEntity.setComponent(scripts); 
*/
 
/*  
//Get screen coordinates based on camera perspective (x,y coordinates)
var goonCoordinates = goo.viewCam.cameraComponent.camera.getScreenCoordinates(
    goonEntity.transformComponent.transform.translation,
    goo.renderer.viewportWidth,
    goo.renderer.viewportHeight
); 
*/
                        
/*
//Disable camera
var cam = loader.getCachedObjectForRef('entities/DefaultToolCamera.entity');
cam.scriptComponent.scripts = [];
*/

/*
//Change size
goonEntity.transformComponent.setScale(1.1,1.1,1.1) 
*/
/*
//Swittching cameras
if (cameraEntity && cameraEntity.cameraComponent) {
    SystemBus.emit('goo.setCurrentCamera', {
        camera: cameraEntity.cameraComponent.camera,
        entity: cameraEntity
    });
}
*/

/*
//Get the ray that is a line from the camera to the point you click
goo.viewCam.cameraComponent.camera.getPickRay(
        click.x,
        click.y,
        goo.renderer.viewportWidth,
        goo.renderer.viewportHeight,
        goo.ray
    );
*/

/*
// Use the picking system to check if a ray intersects with something
//Import 'goo/entities/systems/PickingSystem',  'goo/picking/PrimitivePickLogic',

var picking = new PickingSystem({pickLogic: new PrimitivePickLogic()});
goo.world.setSystem(picking); 

goo.castRay = function(ray, mask, all){
    picking.pickRay = ray;
    picking.mask = mask;
    picking.all = all;
    picking._process();
    //return picking.hit;
};
picking.onPick(function(result){

});
*/