export function decode(bytes) {
  const status = bytes[0];
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ");
  if (status === 0xf0) {
    return `SYSEX      len=${bytes.length}  raw=${hex}`;
  }
  const type = status & 0xf0;
  const channel = (status & 0x0f) + 1;
  switch (type) {
    case 0x90: {
      const [, note, velocity] = bytes;
      return velocity === 0
        ? `NOTE OFF   ch=${channel} note=${note} velocity=${velocity}  raw=${hex}`
        : `NOTE ON    ch=${channel} note=${note} velocity=${velocity}  raw=${hex}`;
    }
    case 0x80: {
      const [, note, velocity] = bytes;
      return `NOTE OFF   ch=${channel} note=${note} velocity=${velocity}  raw=${hex}`;
    }
    case 0xb0: {
      const [, controller, value] = bytes;
      return `CC         ch=${channel} cc=${controller} value=${value}  raw=${hex}`;
    }
    case 0xe0: {
      const [, lsb, msb] = bytes;
      const value = (msb << 7) | lsb;
      return `PITCHBEND  ch=${channel} value14=${value}  raw=${hex}`;
    }
    case 0xd0: {
      const [, pressure] = bytes;
      return `CHAN PRESS ch=${channel} pressure=${pressure}  raw=${hex}`;
    }
    case 0xa0: {
      const [, note, pressure] = bytes;
      return `POLY PRESS ch=${channel} note=${note} pressure=${pressure}  raw=${hex}`;
    }
    default:
      return `UNKNOWN    raw=${hex}`;
  }
}

export function findPort(portObj, nameSubstring) {
  for (let i = 0; i < portObj.getPortCount(); i++) {
    if (portObj.getPortName(i).includes(nameSubstring)) return i;
  }
  return -1;
}
