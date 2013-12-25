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
            //JAVI -> Funcion castRay, es la que dispara el rayo desde la camara y se lo pone al sistema de "picking" que intersecciona con los objetos 
            //El pavo de github usa la funcion https://github.com/Goobuzz/Bubble-Pop/blob/gh-pages/js/Game.js 
            // onPick modificada, devolviendole los objetos exactos o algo asi. De momento nos da igual , podemos hacerlo mejor
            goo.castRay = function(ray, mask, all){
                picking.pickRay = ray;
                picking.mask = mask;
                picking.all = all;
                picking._process();
                //return picking.hit;
            };
            //Esto es de js previene que puedas añadir mas propiedades al objeto. Asi será mas optimo
            Object.freeze(goo.castRay);
            
            
			// The loader takes care of loading the data
			var loader = new DynamicLoader({
				world: goo.world,
				rootPath: 'res',
				progressCallback: progressCallback});

			loader.loadFromBundle('project.project', 'root.bundle', {recursive: false, preloadBinaries: true}).then(function(configs) {

				// This code will be called when the project has finished loading.
				goo.renderer.domElement.id = 'goo';
				document.body.appendChild(goo.renderer.domElement);

				//JAVI -> Application code goes here! En el configs viene todo lo cargado del fichero root.bundle
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
                var goonEntity = loader.getCachedObjectForRef('goon_bind/entities/RootNode.entity');
                console.log(goonEntity);
                //Decimos que viewCam es la entidad camera entity del root bundle ( definida en goo create)
                goo.viewCam = loader.getCachedObjectForRef('entities/Camera.entity');
                
                //Decimos que cada vez que se haga el loop se ejecute lo de dentro de aqui
                goo.callbacks.push(function() {
                    if(isClicking && intersectionWithFloor){
                        //JAVI -> En goonEntity.transformComponent.transform.translation estan las coordenadas x,y,z del muñeco
                        //Todas las entidades tienen transformComponent.transform.translation o rotation
                        
                        //Usamos lerp para mover, en vez de sumar directamente los valores
                        //Porque se supone que lo hace mejor http://www.gootechnologies.com/learn/engine/examples/lerping/
                        goonEntity.transformComponent.transform.translation.lerp(new Vector3(intersectionWithFloor.x,0,intersectionWithFloor.z ), goo.world.tpf*5);
                        // update the new transforms
                        goonEntity.transformComponent.setUpdated();
                        
                    }
                });

                //Javi -> Usamos hammer.js para detectar los eventos touch / Aqui tenemos que poner lo de que cambie la posicion
                // Mirar si se puede hacer con hammer js o como el buranzaga tiene codigo de esto tmb (pero para raton, no tactil)
                var element = document.getElementById('goo');
                var hammertime = Hammer(element).on("touch", function(ev) {
                    ev.gesture.preventDefault()
                    isClicking = true;
                    //Creamos el rayo para determinar el punto donde tocamos
                    //Esto me lo he copiado de buranzaga tmb
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

//Cosas utiles
/* var scripts = new ScriptComponent();
    scripts.scripts.push({run:function(entity, tpf){
       entity.transformComponent.setTranslation( -18-(20*tpf), 0, 21);
    }});
    goonEntity.setComponent(scripts); */
 //obtenemos Las coordenadas del bicho en funcion a la pantalla
                       /*  var goonCoordinates = goo.viewCam.cameraComponent.camera.getScreenCoordinates(
                            goonEntity.transformComponent.transform.translation,
                            goo.renderer.viewportWidth,
                            goo.renderer.viewportHeight
                        ); */