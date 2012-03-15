# Debug scenes

Folder with debug scenes to test different functionality in the engine. The CANNON.Demo class should be used to produce different scenes.

You may wonder why there is one examples/ folder and one debug/ folder that contains similar stuff. The main difference is that the visualization is automatically generated in the debug scenes ( using app.addVisual(body) ). In the examples/ folder, everything from creating scenes to creating visuals is demonstrated.

In short, the debug/ scenes are mainly for debugging of the engine in a quick way, and the examples/ are for developers of apps using the engine. Both should be good for demonstrations.