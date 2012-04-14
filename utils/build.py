#!/usr/bin/env python

try:
	import argparse
	ap = 1
except ImportError:
	import optparse
	ap = 0

import os
import tempfile
import sys
from JSCompress import JSCompressor

COMMON_FILES = ['Cannon.js',
		'collision/Broadphase.js',
		'collision/NaiveBroadphase.js',
		'math/Mat3.js',
		'math/Vec3.js',
		'math/Quaternion.js',
		'objects/Shape.js',
		'objects/RigidBody.js',
		'objects/Sphere.js',
		'objects/Box.js',
		'objects/Plane.js',
		'objects/Compound.js',
		'solver/Solver.js',
		'material/Material.js',
		'material/ContactMaterial.js',
		'world/World.js']
DEMO_FILES = ['demo/Demo.js']

def merge(files):
	buffer = []
	for filename in files:
		with open(os.path.join('..', 'src', filename), 'r') as f:
			buffer.append(f.read())
	return "".join(buffer)

def output(text, filename):
	with open(os.path.join('..', 'build', filename), 'w') as f:
		f.write(text)

def compress(text):
	compressor = JSCompressor()
	return compressor.compress(text)

def addHeader(text):
	with open(os.path.join('..', 'VERSION'), 'r') as handle:
		revision = handle.read().rstrip()
	with open(os.path.join('..', 'LICENSE'), 'r') as handle:
		license = handle.read().rstrip()
	return license + "\n\n" +text

def buildLib(files, minified, filename):
	text = merge(files)
	filename = filename + '.js'

	print "=" * 40
	print "Compiling", filename
	print "=" * 40

	if minified:
		text = compress(text)

	output(addHeader(text), filename)

def parse_args():
	if ap:
		parser = argparse.ArgumentParser(description='Build and compress cannon.js')
		args = parser.parse_args()

	else:
		parser = optparse.OptionParser(description='Build and compress cannon.js')
		args, remainder = parser.parse_args()

	"""
	# If no arguments have been passed, show the help message and exit
	if len(sys.argv) == 1:
		parser.print_help()
		sys.exit(1)
	"""
	return args

def main(argv=None):
	args = parse_args()
	buildLib(COMMON_FILES, False, 'cannon')
	buildLib(COMMON_FILES, True,  'cannon.min')
	buildLib(DEMO_FILES, False,  'cannon.demo')

if __name__ == "__main__":
	main()
