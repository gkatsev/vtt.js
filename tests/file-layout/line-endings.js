var assert = require("assert"),
    WebVTT = require("../../lib/vtt.js"),
    VTTCue = require("../../lib/vttcue.js");

function parseChunks(chunks) {
  var parser = new WebVTT.Parser({ VTTCue: VTTCue }, WebVTT.StringDecoder()),
      cues = [],
      errors = [];
  parser.oncue = function(cue) { cues.push(cue.text); };
  parser.onparsingerror = function(error) { errors.push(error.code); };
  chunks.forEach(function(chunk) { parser.parse(chunk); });
  parser.flush();
  assert.deepEqual(errors, []);
  return cues;
}

describe("streaming line endings", function() {
  ["\n", "\r\n", "\r"].forEach(function(ending) {
    var input = ["WEBVTT", "", "00:00:00.000 --> 00:00:01.000", "first", "",
      "00:00:01.000 --> 00:00:02.000", "second", "", ""].join(ending);

    it("parses " + JSON.stringify(ending) + " at every chunk boundary", function() {
      for (var split = 0; split <= input.length; split++) {
        assert.deepEqual(parseChunks([input.slice(0, split), "", input.slice(split)]),
          ["first", "second"], "split at " + split);
      }
    });

    it("parses " + JSON.stringify(ending) + " one character at a time", function() {
      assert.deepEqual(parseChunks(input.split("")), ["first", "second"]);
    });

    it("accepts a signature ending in " + JSON.stringify(ending), function() {
      assert.deepEqual(parseChunks(["WEBVTT" + ending]), []);
    });
  });

  it("accepts mixed line endings and a final carriage return", function() {
    assert.deepEqual(parseChunks(["WEBVTT\r\n\r00:00:00.000 --> 00:00:01.000\nhello\r"]), ["hello"]);
  });
});
