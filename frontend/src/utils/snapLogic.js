const BAND_TOL = 30
const R = 12

export const buildClusters = (widths) => {
  const uniq = [...new Set(widths)].sort((a, b) => a - b)
  const clusters = []
  uniq.forEach(w => {
    const last = clusters[clusters.length - 1]
    if (last && w - last.min <= BAND_TOL) last.max = w
    else clusters.push({ min: w, max: w })
  })
  return clusters
}

export const snapW = (w, clusters) => {
  if (w == null) return null
  const c = clusters.find(cl => w >= cl.min && w <= cl.max)
  return c ? c.max : w
}

export const blockBorderRadius = (i, n, bands, hatBand) => {
  const bAbove = i === 0 ? hatBand : bands[i - 1]
  const bBelow = i === n - 1 ? null : bands[i + 1]
  const sameAbove = bands[i] != null && bAbove != null && bands[i] === bAbove
  const sameBelow = bands[i] != null && bBelow != null && bands[i] === bBelow
  const isLast = i === n - 1
  const tr = sameAbove ? 0 : R
  const br = isLast ? R : (sameBelow ? 0 : R)
  const bl = isLast ? R : 0
  return `0px ${tr}px ${br}px ${bl}px`
}

export const hatBorderRadius = (n, hatBand, band0) => {
  const hatBR = n === 0 ? 0 : (hatBand != null && band0 != null && hatBand === band0 ? 0 : R)
  return `14px 14px ${hatBR}px 0px`
}
