import * as audio from 'waves-audio';
import ui from 'waves-ui';
import { AudioBufferLoader } from 'waves-loaders';

const audioFile = 'assets/drum-loop.wav';
const loader = new AudioBufferLoader();
const audioContext = audio.audioContext;

const demo = (buffer) => {
  // -------------------------------------------------------------
  // 1. define global constantes
  // -------------------------------------------------------------
  const width = 1000;
  const height = 200;
  const duration = buffer.duration;
  const pixelsPerSecond = width / duration;
  const $trackElement = document.querySelector('#track');

  // -------------------------------------------------------------
  // 2. create a timeline, a track and display the waveform
  // -------------------------------------------------------------

  // create a timeline, with default pixels per second and width
  const timeline = new ui.core.Timeline(pixelsPerSecond, width);

  // create a track inside a given DOM element
  // (third argument is an id for the track)
  const track = timeline.createTrack($trackElement, height, 'track');

  // use the shipped helper to dsplay the waveform of the buffer.
  const waveformLayer = new ui.helpers.WaveformLayer(buffer, {
    height: height,
    color: 'white',
  });

  // add the layer to the track
  timeline.addLayer(waveformLayer, 'track');

  // -------------------------------------------------------------
  // 3. play the audio file
  // -------------------------------------------------------------

  // create an engine to read the buffer
  const playerEngine = new audio.PlayerEngine({ buffer: buffer });
  playerEngine.connect(audioContext.destination);

  // create a transport and add the engine (create a transported engine)
  const transport = new audio.Transport();
  const transportedEngine = transport.add(playerEngine);

  // control the transport with a playControl
  const playControl = new audio.PlayControl(transport);
  playControl.setLoopBoundaries(0, duration);
  playControl.loop = true;
  playControl.start();

  // -------------------------------------------------------------
  // 4. add a cursor
  // -------------------------------------------------------------
  const cursorLayer = new ui.helpers.CursorLayer({ height });
  timeline.addLayer(cursorLayer, 'track');
  // keep cursor in sync with the player current position
  (function loop() {
    cursorLayer.currentPosition = playControl.currentPosition;
    cursorLayer.update();
    requestAnimationFrame(loop);
  }());

  // -------------------------------------------------------------
  // 5. display a segment
  // -------------------------------------------------------------

  // low level example of the definition of a layer
  const segment = { duration: 2, start: 1 };

  // time contexts are abstraction that keep time to pixel
  // ratios coherent among all the visualization
  const segmentTimeContext = new ui.core.LayerTimeContext(timeline.timeContext);

  const segmentLayer = new ui.core.Layer('entity', segment, {
    height: height,
    opacity: 0.5,
  });

  segmentLayer.setTimeContext(segmentTimeContext);

  // the layer is configured with a Shape constructor
  segmentLayer.configureShape(ui.shapes.Segment, {
    // the `x` position correspond to `segment.start`
    x: (d, v = null) => {
      if (v !== null)
        d.start = v;

      return d.start;
    },
    // `width` correspond to `segment.duration`
    width: (d, v = null) => {
      if (v !== null)
        d.duration = v;

      return d.duration;
    },
    color: () => 'steelblue',
  });

  // -------------------------------------------------------------
  // 6. make it editable
  // -------------------------------------------------------------
  // behaviors defines how a particular shape should
  // react to interactions (e.g. `move`, `resize`)
  segmentLayer.setBehavior(new ui.behaviors.SegmentBehavior());
  timeline.addLayer(segmentLayer, 'track');
  // simple state machine to define what the timeline
  // should do with user inputs
  const editionState = new ui.states.SimpleEditionState(timeline);
  timeline.state = editionState;

  // -------------------------------------------------------------
  // 7. keep player boundaries in sync with the segment
  // -------------------------------------------------------------
  playControl.setLoopBoundaries(1, 3);
  // apply limits of the segment as boundaries of the playControl
  segmentLayer.on('edit', () => {
    const start = segment.start;
    const end = segment.start + segment.duration;
    playControl.setLoopBoundaries(start, end);
  });
}

// -------------------------------------------------------------
// 0. load and init
// -------------------------------------------------------------

loader
  .load(audioFile)
  .then(demo)
  .catch((err) => console.log(err.stack));


