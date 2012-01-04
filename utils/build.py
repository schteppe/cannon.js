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

COMMON_FILES = ['physics.js']
EXTRAS_FILES = []

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

def addHeader(text, endFilename):
	with open(os.path.join('..', 'REVISION'), 'r') as handle:
		revision = handle.read().rstrip()
	return (("/**\n"+
		 " * %s r%s - A lightweight 3D physics engine for the web\n"+
		 " * \n"+
		 " * http://github.com/schteppe/physics.js\n"+
		 " * \n"+
		 " * Copyright (c) 2012 Stefan Hedman (steffe.se)\n"+
		 " * \n" +
		 " * Permission is hereby granted, free of charge, to any person obtaining a copy\n"+
		 " * of this software and associated documentation files (the \"Software\"), to deal\n"+
		 " * in the Software without restriction, including without limitation the rights\n"+
		 " * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n"+
		 " * copies of the Software, and to permit persons to whom the Software is\n"+
		 " * furnished to do so, subject to the following conditions:\n"+
		 " *\n"+
		 " * The above copyright notice and this permission notice shall be included in\n"+
		 " * all copies or substantial portions of the Software.\n"+
		 " *\n"+
		 " * The Software shall be used for Good, not Evil.\n"+
		 " *\n"+
		 " * THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n"+
		 " * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n"+
		 " * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n"+
		 " * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n"+
		 " * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n"+
		 " * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n"+
		 " * SOFTWARE.\n"+
		 " */\n\n") % (endFilename, revision)) + text

def makeDebug(text):
	position = 0
	while True:
		position = text.find("/* DEBUG", position)
		if position == -1:
			break
		text = text[0:position] + text[position+8:]
		position = text.find("*/", position)
		text = text[0:position] + text[position+2:]
	return text

def buildLib(files, debug, minified, filename):
	text = merge(files)
	if debug:
		text = makeDebug(text)
		filename = filename + 'Debug'

	if filename == "Physics":
		folder = ''
	else:
		folder = 'custom/'

	filename = filename + '.js'

	print "=" * 40
	print "Compiling", filename
	print "=" * 40

	if minified:
		text = compress(text)

	output(addHeader(text, filename), folder + filename)


def buildIncludes(files, filename):
	template = '\t\t<script type="text/javascript" src="../src/%s"></script>'
	text = "\n".join(template % f for f in files)
	output(text, filename + '.js')

def parse_args():
	if ap:
		parser = argparse.ArgumentParser(description='Build and compress Physics.js')
		parser.add_argument('--includes', help='Build includes.js', action='store_true')
		parser.add_argument('--common', help='Build Physics.js', action='store_const', const=True)
		parser.add_argument('--debug', help='Generate debug versions', action='store_const', const=True, default=False)
		parser.add_argument('--minified', help='Generate minified versions', action='store_const', const=True, default=False)
		parser.add_argument('--all', help='Build all Physics.js versions', action='store_true')
		args = parser.parse_args()

	else:
		parser = optparse.OptionParser(description='Build and compress Physics.js')
		parser.add_option('--includes', dest='includes', help='Build includes.js', action='store_true')
		parser.add_option('--common', dest='common', help='Build Physics.js', action='store_const', const=True)
		parser.add_option('--debug', dest='debug', help='Generate debug versions', action='store_const', const=True, default=False)
		parser.add_option('--minified', help='Generate minified versions', action='store_const', const=True, default=False)
		parser.add_option('--all', dest='all', help='Build all Physics.js versions', action='store_true')

		args, remainder = parser.parse_args()

	# If no arguments have been passed, show the help message and exit
	if len(sys.argv) == 1:
		parser.print_help()
		sys.exit(1)

	return args

def main(argv=None):
	args = parse_args()
	debug = args.debug
	minified = args.minified

	config=[
		['Physics', 'includes', COMMON_FILES + EXTRAS_FILES, args.common]
		]

	for fname_lib, fname_inc, files, enabled in config:
		if enabled or args.all:
			buildLib(files, debug, minified, fname_lib)
			if args.includes:
				buildIncludes(files, fname_inc)

if __name__ == "__main__":
	main()
