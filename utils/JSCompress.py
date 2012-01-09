'''
a regex-based JavaScript code compression kludge
originally from: http://code.activestate.com/recipes/496882-javascript-code-compression/
'''
import re

class JSCompressor(object):

    def __init__(self, compressionLevel=2, measureCompression=False):
        '''
        compressionLevel:
        0 - no compression, script returned unchanged. For debugging only -
            try if you suspect that compression compromises your script
        1 - Strip comments and empty lines, don't change line breaks and indentation (code remains readable)
        2 - Additionally strip insignificant whitespace (code will become quite unreadable)

        measureCompression: append a comment stating the extent of compression
        '''
        self.compressionLevel = compressionLevel
        self.measureCompression = measureCompression

    # a bunch of regexes used in compression
    # first, exempt string and regex literals from compression by transient substitution

    findLiterals = re.compile(r'''
        (\'.*?(?<=[^\\])\')             |       # single-quoted strings
        (\".*?(?<=[^\\])\")             |       # double-quoted strings
        ((?<![\*\/])\/(?![\/\*]).*?(?<![\\])\/) # JS regexes, trying hard not to be tripped up by comments
        ''', re.VERBOSE)

    # literals are temporarily replaced by numbered placeholders

    literalMarker = '@_@%d@_@'                  # temporary replacement
    backSubst = re.compile('@_@(\d+)@_@')       # put the string literals back in

    mlc1 = re.compile(r'(\/\*.*?\*\/)')         # /* ... */ comments on single line
    mlc = re.compile(r'(\/\*.*?\*\/)', re.DOTALL)  # real multiline comments
    slc = re.compile('\/\/.*')                  # remove single line comments

    collapseWs = re.compile('(?<=\S)[ \t]+')    # collapse successive non-leading white space characters into one

    squeeze = re.compile('''
        \s+(?=[\}\]\)\:\&\|\=\;\,\.\+])   |     # remove whitespace preceding control characters
        (?<=[\{\[\(\:\&\|\=\;\,\.\+])\s+  |     # ... or following such
        [ \t]+(?=\W)                      |     # remove spaces or tabs preceding non-word characters
        (?<=\W)[ \t]+                           # ... or following such
        '''
        , re.VERBOSE | re.DOTALL)

    def compress(self, script):
        '''
        perform compression and return compressed script
        '''
        if self.compressionLevel == 0:
            return script

        lengthBefore = len(script)

        # first, substitute string literals by placeholders to prevent the regexes messing with them
        literals = []

        def insertMarker(mo):
            l = mo.group()
            literals.append(l)
            return self.literalMarker % (len(literals) - 1)

        script = self.findLiterals.sub(insertMarker, script)

        # now, to the literal-stripped carcass, apply some kludgy regexes for deflation...
        script = self.slc.sub('', script)       # strip single line comments
        script = self.mlc1.sub(' ', script)     # replace /* .. */ comments on single lines by space
        script = self.mlc.sub('\n', script)     # replace real multiline comments by newlines

        # remove empty lines and trailing whitespace
        script = '\n'.join([l.rstrip() for l in script.splitlines() if l.strip()])

        if self.compressionLevel == 2:              # squeeze out any dispensible whitespace
            script = self.squeeze.sub('', script)
        elif self.compressionLevel == 1:            # only collapse multiple whitespace characters
            script = self.collapseWs.sub(' ', script)

        # now back-substitute the string and regex literals
        def backsub(mo):
            return literals[int(mo.group(1))]

        script = self.backSubst.sub(backsub, script)

        if self.measureCompression:
            lengthAfter = float(len(script))
            squeezedBy = int(100*(1-lengthAfter/lengthBefore))
            script += '\n// squeezed out %s%%\n' % squeezedBy

        return script


if __name__ == '__main__':
    script = '''


    /* this is a totally useless multiline comment, containing a silly "quoted string",
       surrounded by several superfluous line breaks
     */


    // and this is an equally important single line comment

    sth = "this string contains 'quotes', a /regex/ and a // comment yet it will survive compression";

    function wurst(){           // this is a great function
        var hans = 33;
    }

    sthelse = 'and another useless string';

    function hans(){            // another function
        var   bill   =   66;    // successive spaces will be collapsed into one;
        var bob = 77            // this line break will be preserved b/c of lacking semicolon
        var george = 88;
    }
    '''

    for x in range(1,3):
        print '\ncompression level', x, ':\n--------------'
        c = JSCompressor(compressionLevel=x, measureCompression=True)
        cpr = c.compress(script)
        print cpr
        print 'length', len(cpr)
