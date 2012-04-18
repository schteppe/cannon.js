START     = LICENSE src/wrapper/Start.js
CANNON    = src/Cannon.js
COLLISION = src/collision/Broadphase.js src/collision/NaiveBroadphase.js
MATH      = src/math/Mat3.js src/math/Vec3.js src/math/Quaternion.js
OBJECTS   = src/objects/Shape.js src/objects/RigidBody.js src/objects/Sphere.js src/objects/Box.js src/objects/Plane.js src/objects/Compound.js
SOLVER    = src/solver/*
MATERIAL  = src/material/Material.js src/material/ContactMaterial.js
WORLD     = src/world/*
END       = src/wrapper/End.js

ALL_CORE_FILES = $(CANNON) $(COLLISION) $(MATH) $(OBJECTS) $(SOLVER) $(MATERIAL) $(WORLD)
ALL_FILES = $(START) $(ALL_CORE_FILES) $(END)

CANNON_BUILD        = ./build/cannon.js
CANNON_BUILD_MINIFY = ./build/cannon.min.js
CANNON_BUILD_PRETTY = ./build/cannon.pretty.js

all: minify

bundle:
	cat $(ALL_FILES) > $(CANNON_BUILD)

minify: bundle
	# 
	# Minifying cannon.js
	./node_modules/.bin/uglifyjs -o $(CANNON_BUILD_MINIFY) $(CANNON_BUILD)

pretty: bundle
	# 
	# Pretty print minifying cannon.js
	./node_modules/.bin/uglifyjs -b -o $(CANNON_BUILD_PRETTY) $(CANNON_BUILD)

hint: bundle
	./node_modules/.bin/jshint $(ALL_CORE_FILES)

size: minify
	# 
	# Checking filesize
	cp $(CANNON_BUILD_MINIFY) $(CANNON_BUILD_MINIFY).temp
	gzip $(CANNON_BUILD_MINIFY).temp
	gzip -l $(CANNON_BUILD_MINIFY).temp.gz
	rm $(CANNON_BUILD_MINIFY).temp.gz

test: bundle
	./node_modules/.bin/nodeunit ./test