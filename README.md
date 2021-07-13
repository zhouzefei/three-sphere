### CODE
```javascript
import ThreeSphere from "three-sphere";
import worldTransparent from "./images/world_transparent.jpg";

const container = document.getElementById("earth1");
const threeSphereInstance = new ThreeSphere({
	radius: 142,
	mapImg: worldTransparent,
	transparent: true,
	needHelp: false,
	container: container,
	width: container.clientWidth,
	height: 420,
	countryEdge: {
		drawLine: true
	},
	point: {
		pointsData,
		wave: true
	},
	flyLine: {
		lineData: lineData
	},
	control: {
		autoRotate: true,
		enableDamping: true,
		autoRotateSpeed: 0.4
	}
});
threeSphereInstance.init();
```
### API
#### ThreeSphere 地球config配置
<table><thead><tr><th style="text-align: left;">参数</th><th style="text-align: left;">说明</th><th style="text-align: left;">类型</th><th style="text-align: left;">默认值</th></tr></thead><tbody><tr><td style="text-align: left;">radius</td><td style="text-align: left;">半径</td><td style="text-align: left;">num</td><td style="text-align: left;">142</td></tr><tr><td style="text-align: left;">mapImg</td><td style="text-align: left;">地球背景图</td><td style="text-align: left;">string</td><td style="text-align: left;"></td></tr><tr><td style="text-align: left;">transparent</td><td style="text-align: left;">地球是否透明</td><td style="text-align: left;">bool</td><td style="text-align: left;">true</td></tr><tr><td style="text-align: left;">needHelp</td><td style="text-align: left;">是否需要帮助坐标</td><td style="text-align: left;">bool</td><td style="text-align: left;">false</td></tr><tr><td style="text-align: left;">container</td><td style="text-align: left;">容器</td><td style="text-align: left;">dom</td><td style="text-align: left;">document.getElementById('App')</td></tr><tr><td style="text-align: left;">countryEdge</td><td style="text-align: left;">国家边界</td><td style="text-align: left;">obj</td><td style="text-align: left;">null</td></tr><tr><td style="text-align: left;">countryShape</td><td style="text-align: left;">国家面</td><td style="text-align: left;">obj</td><td style="text-align: left;">null</td></tr><tr><td style="text-align: left;">point</td><td style="text-align: left;">点</td><td style="text-align: left;">obj</td><td style="text-align: left;">null</td></tr><tr><td style="text-align: left;">point.pointsData</td><td style="text-align: left;">点数据</td><td style="text-align: left;">array</td><td style="text-align: left;">null</td></tr><tr><td style="text-align: left;">point[type]</td><td style="text-align: left;">点类型(可根据lglt2xyz坐标转换自由添加球面Layer效果)当前支持球波、柱状；</td><td style="text-align: left;">point.wave=true(球波); point.column=true(柱状图);</td><td style="text-align: left;">null</td></tr><tr><td style="text-align: left;">flyLine</td><td style="text-align: left;">飞线</td><td style="text-align: left;">obj</td><td style="text-align: left;">null</td></tr><tr><td style="text-align: left;">flyLine.lineData</td><td style="text-align: left;">飞线数据</td><td style="text-align: left;">array</td><td style="text-align: left;">null</td></tr><tr><td style="text-align: left;">control</td><td style="text-align: left;">控制器</td><td style="text-align: left;">obj</td><td style="text-align: left;">null</td></tr><tr><td style="text-align: left;">control.autoRotate</td><td style="text-align: left;">自动旋转</td><td style="text-align: left;">bool</td><td style="text-align: left;">false</td></tr><tr><td style="text-align: left;">control.enableDamping</td><td style="text-align: left;">缓冲</td><td style="text-align: left;">bool</td><td style="text-align: left;">false</td></tr><tr><td style="text-align: left;">control.autoRotateSpeed</td><td style="text-align: left;">旋转速度</td><td style="text-align: left;">num</td><td style="text-align: left;">2</td></tr></tbody></table>

#### lglt2xyz 坐标转换
```javascript
	const lglt2xyz = (lg, lt, r) => {
		const phi = (180 + lg) * (Math.PI / 180)
		const theta = (90 - lt) * (Math.PI / 180)
		const x = -r * Math.sin(theta) * Math.cos(phi);
		const y = r * Math.cos(theta);
		const z = r * Math.sin(theta) * Math.sin(phi);
		return new THREE.Vector3(x,y,z)
	}
```

#### Draw 绘制边／面
