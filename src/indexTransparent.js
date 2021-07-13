import TWEEN from "@tweenjs/tween.js";
import encoder from 'geojson-decoder';
import "./sources/js/three.min";
import OrbitControls from "./sources/js/OrbitControls"; // 旋转
import TessellateModifier from "./sources/js/modifiers/TessellateModifier"; // 精细化方案1解决塌陷问题
import SubdivisionModifier from "./sources/js/modifiers/SubdivisionModifier"; // 精细化方案2解决塌陷问题
import { drawThreeLine } from "./drawLine"; // 国家边界线

import { worldGeoJson } from "./sources/js/world";


const THREE = window.THREE;
// 光晕
THREE.gySphere = {
    uniforms: {
        'texture': { type: 't', value: null }
    },
    vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        'vNormal = normalize( normalMatrix * normal );',
        'vUv = uv;',
        '}'
    ].join('\n'),
    fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
        'vec3 diffuse = texture2D( texture, vUv ).xyz;',
        'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
        'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
        'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
    ].join('\n')
}

export default class ThreeSphere {
	constructor(set,mapData){
        this.set = {
            radius:142,
            ...set
        };
        this.map = mapData || encoder.decode(worldGeoJson);
    }
    init(){
        const { pointsData, addPoints, drawLine, radius, needHelp } = this.set || {};

        this.scene = new THREE.Scene();
        this.scene.background="#333"

        this.container = document.getElementById('App');

        this.setCamera({x:500, y:0, z:500});
        this.setLight();
        this.setRender();
        this.setControl();

        if(needHelp){
            this.setHelper();
        }

        this.createGlobal();

        // 绘制边界线条
        if(drawLine){
            drawThreeLine(this.map, radius, 'sphere', { color: '#fff', opacity: .2, transparent: true}, this.scene)
        }

        // 添加高性能点
        if(addPoints){
            this.addPoints(pointsData)
        }

        this.animate();
        window.addEventListener( 'resize', this.windowResize.bind(this), false );
    }
    // 设置相机
    setCamera(data){
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1280);
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
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
    }
    // 设置控制器
    setControl(){
        const { autoRotate, autoSpeed } = this.set || {};
        this.controls = new THREE.OrbitControls(this.camera);
        this.controls.update();
        if(autoRotate){
            this.controls.autoRotate = true;
            this.controls.enableDamping = true;
            this.controls.autoRotateSpeed = autoSpeed || 0.4;
        }
    }
    // 坐标轴
    setHelper(){
        const axisHelper = new THREE.AxisHelper(300);
        this.scene.add(axisHelper);
    }
    // 创建地球
    createGlobal(){
        const { radius, mapImg } = this.set || {};
        const geometry = new THREE.SphereGeometry(radius, 50, 50);

        const uniforms = THREE.UniformsUtils.clone(THREE.gySphere.uniforms);
        uniforms['texture'].value = THREE.ImageUtils.loadTexture(mapImg);

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: THREE.gySphere.vertexShader,
            fragmentShader: THREE.gySphere.fragmentShader,
            blending: THREE.NormalBlending,
            transparent: true,
            depthWrite:false
        });

        const meshEarth = new THREE.Mesh( geometry, material );
        this.scene.add(meshEarth);
    }
    // 添加高性能点
    addPoints(data){
        const { radius, pointImg } = this.set || {};
        for(let [i, d] of data.entries()){
            let point = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({
                map: new THREE.ImageUtils.loadTexture(pointImg),
                transparent: true,
                side: THREE.DoubleSide
            }))
            point.position.copy(this.lglt2xyz(...d.position, radius))
            point.lookAt(new THREE.Vector3(0,0,0))
            point.name = i
            this.scene.add(point)
        }
    }
    lglt2xyz(lg, lt, r){
        lg = (lg+90) * Math.PI / 180
        lt = lt * Math.PI / 180
        return new THREE.Vector3(
            Math.sin(lg) * Math.cos(lt) * r,
            Math.sin(lt) * r,
            Math.cos(lg) * Math.cos(lt) * r,
        )
    }
    // 设置动画
    animate(){
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene,this.camera);
    }
    // 监听窗口大小
    windowResize(){
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}
