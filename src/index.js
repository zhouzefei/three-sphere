import encoder from 'geojson-decoder';
import * as THREE from "three";
import { FlyLine, SphereWave } from "@tntv/layers";
import { OrbitControls } from "./sources/js/OrbitControls"; // 旋转
import { lglt2xyz } from "../src/util";
import Draw from "./draw";
import Point from './components/Point';
import { GySphere } from './constants/sphereShader';

export {
    lglt2xyz,
    Draw,
    Point
};
export default class ThreeSphere {
	constructor(mapData,set){
        this.set = {
			radius:142,
			width: window.innerWidth,
			height:window.innerHeight,
            ...set
        };
        this.shapeGroup = null;
        this.lineGroup = null;
        this.map = encoder.decode(mapData);
    }
    init(){
        const { radius, needHelp, point, countryEdge, flyLine, countryShape } = this.set || {};
        this.rayCaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.interSelected = null;
        this.scene = new THREE.Scene();
        this.scene.background="#333";
        this.container = this.set.container || document.getElementById('App');

        this.setCamera({x:-150, y:300, z:-400});
        this.setLight();
        this.setRender();
        this.setControl();
        this.createGlobal();

        if(needHelp){
            this.setHelper();
        }

        if(countryEdge || countryShape){
            // 绘制面、边界
            const draw = new Draw({
                json:this.map,
                radius:radius+2,
                scene:this.scene,
            });
            const { shapeGroup, lineGroup } = draw.init({
                line: countryEdge,
                lineOptions:{
                    color: 'white',
                    opacity: .16,
                    transparent: true
                },
                shape: countryShape,
                shapeOptions:{

                }
            })

            if(countryEdge){
                this.shapeGroup = shapeGroup;
            }
            if(countryShape){
                this.lineGroup = lineGroup;
                window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
            }
        }

        // 添加高性能点
        if(point){
            const { pointsData, column, wave } = point || {};
            // 柱体
            if(column){
                const createPoint = new Point({radius,pointsData});
                this.columnarPointGroup = createPoint.columnar();
                this.scene.add(this.columnarPointGroup)
            }

            // wave
            if(wave){
                this.sphereWave = new SphereWave({
                    radius: radius+1,
                    speed: 0.05,
                    minOpacity:0.1
                });
                this.scene.add(this.sphereWave);

                const columnData = [];
                for(let d of pointsData){
                    columnData.push({
                        position: lglt2xyz(d.position[0], d.position[1], radius+1),
                        height: Math.random() * 50,
                        color: `rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})`
                    });
                }
                this.sphereWave.setData(columnData);
            }
        }

        // 添加飞线
        if(flyLine){
            this.flySphereLine = new FlyLine({
                addLineTimeout: 100,
                curveType: "2bezier",
                length: 50,
                radius:radius,
                materialConfig: {
                    startColor: new THREE.Vector4(1, 0, 1, 0),
                    endColor: new THREE.Vector4(0, 0, 1, 1)
                }
            });

            this.scene.add(this.flySphereLine);

            const data=[];
            const { lineData } = flyLine || {};
            if(lineData){
                for(let d of lineData){
                    data.push({
                        start: lglt2xyz(d[0][0], d[0][1], radius),
                        end: lglt2xyz(d[1][0], d[1][1], radius)
                    })
                }
            }
            this.flySphereLine.setData(data);
            this.flySphereLine.start();
            this.activeMesh = this.flySphereLine;
        }

        this.animate();
        window.addEventListener('resize', this.windowResize.bind(this), false );
        return this;
    }
    // 设置相机
    setCamera(data){
        this.camera = new THREE.PerspectiveCamera(45, this.set.width / this.set.height, 0.1, 1280);
        const {x,y,z} = data;
        this.camera.position.set(x,y,z);
        this.camera.lookAt(0,0,0);
        this.scene.add(this.camera);
    }
    // 设置光照
    setLight(){
        const light = new THREE.AmbientLight(0x404040);
        const dLight = new THREE.DirectionalLight(0xffffff);
        dLight.position.set(60, 60, 60);
        dLight.distance = 100;
        dLight.intensity = 1.5;
        this.scene.add(light);
        this.scene.add(dLight);
    }
    // 设置渲染器
    setRender() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.setSize(this.set.width, this.set.height);
        this.container.appendChild(this.renderer.domElement);
    }
    // 设置控制器
    setControl(){
        const { control } = this.set || {};
        this.controls = new OrbitControls(this.camera,this.container);
        this.controls.update();
        control &&
        Object.keys(control).length>0 &&
        Object.keys(control).map(c=>{
            if(control[c]){
                this.controls[c] = control[c]
            }
        })
    }
    // 坐标轴
    setHelper(){
        const axesHelper = new THREE.AxesHelper(300);
        this.scene.add(axesHelper);
    }
    // 创建地球
    createGlobal(){
        const { radius, mapImg, transparent } = this.set || {};
        this.geometry = new THREE.SphereGeometry(radius, 50, 50);

        const uniforms = THREE.UniformsUtils.clone(GySphere.uniforms);
        this.mapTexture = new THREE.TextureLoader().load(mapImg)
        uniforms['texture'].value = this.mapTexture;

        this.earthMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: GySphere.vertexShader,
            fragmentShader: GySphere.fragmentShader,
            blending: THREE.NormalBlending,
            depthWrite: !transparent
        });

        this.meshEarth = new THREE.Mesh( this.geometry, this.earthMaterial );
        this.scene.add(this.meshEarth);
    }
    // 设置动画
    animate(){
        this.requestAnimation = requestAnimationFrame(this.animate.bind(this));
        if (this.activeMesh && this.activeMesh.update) {
			this.activeMesh.update();
        }
        if(this.sphereWave && this.sphereWave.update){
            this.sphereWave.update();
        }
        // 执行回调
        if(this.set.cb && typeof this.setcb === 'function'){
            this.set.cb()
        }
        this.controls.update();
        this.renderer.render(this.scene,this.camera);
    }
    // 监听窗口大小
    windowResize(){
        console.log(this.set.width, this.set.height)
        const width = this.set.width || window.innerWidth;
        const height = this.set.height ||  window.innerHeight;
        this.renderer.setSize( width, height );
        this.camera.aspect = width / height ;
        this.camera.updateProjectionMatrix();
    }
    // hover
    onMouseMove(e) {
        const { top,left } = this.container.getBoundingClientRect() || {};
        this.mouse.x = ((event.clientX - (left || 0)) / this.set.width) * 2 - 1;
        this.mouse.y = - ((event.clientY - (top || 0)) / this.set.height) * 2 + 1;
        this.shapeHover()
    }
    // shape hover Event
    shapeHover(){
        this.rayCaster.setFromCamera(this.mouse, this.camera);
        let intersects = this.rayCaster.intersectObjects(this.shapeGroup.children);
        if (intersects.length > 0) {
            var intersectObj = intersects[0].object.material;
            if (!intersectObj || !intersectObj.emissive) return;
            if ( this.interSelected ) {
                this.interSelected.material.opacity = 0;
            }
            this.interSelected = intersects[ 0 ].object;
            // this.interSelected.material.emissive.setHex( 0x5368A6 );
            this.interSelected.material.color.set( 0x305cbf );
            this.interSelected.material.opacity = 0.5;
        } else {
            if ( this.interSelected ) {
                this.interSelected.material.opacity = 0;
            }
            this.interSelected = null;
        }
    }
    disposeGroup(group){
        group.traverse(function(obj) {
            if (obj.type === 'Mesh') {
              obj.geometry.dispose();
              obj.material.dispose();
            }
        })
        this.scene.remove(group)
    }
    dispose(){
        cancelAnimationFrame(this.requestAnimation);
        this.requestAnimation=null;
        this.shapeGroup && this.disposeGroup(this.shapeGroup)
        this.lineGroup && this.disposeGroup(this.lineGroup)
        this.columnarPointGroup && this.disposeGroup(this.columnarPointGroup);
        this.sphereWave && this.sphereWave.dispose();
        this.flySphereLine && this.flySphereLine.dispose();
        this.onMouseMove && window.removeEventListener('mousemove', this.onMouseMove.bind(this));
        window.removeEventListener('resize', this.windowResize.bind(this) );
        if(this.meshEarth){
            this.meshEarth.geometry.dispose();
            this.meshEarth.material.dispose();
            this.scene.remove(this.meshEarth);
        }
        this.scene.dispose();
        this.controls.dispose();
        let gl = this.renderer.domElement.getContext("webgl");
        gl && gl.getExtension("WEBGL_lose_context") && gl.getExtension("WEBGL_lose_context").loseContext();
    }
}
