// GIF URLs from ExerciseDB (https://exercisedb.dev)
// Attribution: AscendAPI / ExerciseDB

export const EXERCISE_GIFS: Record<string, string> = {
  // Chest
  'push-ups': 'https://static.exercisedb.dev/media/vptOQ4N.gif', // deep push up
  'pec-fly': 'https://static.exercisedb.dev/media/ESOd5Pl.gif', // dumbbell incline fly
  'assisted-bench-press': 'https://static.exercisedb.dev/media/EIeI8Vf.gif', // barbell bench press
  'assisted-incline-bench': 'https://static.exercisedb.dev/media/3TZduzM.gif', // barbell incline bench press
  'chest-press': 'https://static.exercisedb.dev/media/DOoWcnA.gif', // lever chest press
  'lying-chest-press': 'https://static.exercisedb.dev/media/SpYC0Kp.gif', // dumbbell bench press

  // Biceps
  'barbell-curl': 'https://static.exercisedb.dev/media/25GPyDY.gif', // barbell curl
  'dumbbell-preacher-curl': 'https://static.exercisedb.dev/media/jivWf8n.gif', // dumbbell preacher curl
  'dumbbell-hammer-curl': 'https://static.exercisedb.dev/media/slDvUAU.gif', // dumbbell hammer curl
  'cable-rope-hammer-curl': 'https://static.exercisedb.dev/media/HPlPoQA.gif', // cable hammer curl with rope
  'cable-bar-curl': 'https://static.exercisedb.dev/media/G08RZcQ.gif', // cable curl

  // Triceps
  'cable-rope-pushdown': 'https://static.exercisedb.dev/media/dU605di.gif', // cable pushdown with rope
  'overhead-tricep-extension': 'https://static.exercisedb.dev/media/2IxROQ1.gif', // cable overhead tricep extension rope

  // Back
  'pull-ups': 'https://static.exercisedb.dev/media/lBDjFxJ.gif', // pull-up
  'machine-pulldown': 'https://static.exercisedb.dev/media/LEprlgG.gif', // cable lat pulldown full ROM
  'machine-seated-cable-row': 'https://static.exercisedb.dev/media/fUBheHs.gif', // cable seated row
  'neutral-pulldown': 'https://static.exercisedb.dev/media/rkg41Fb.gif', // twin handle parallel grip lat pulldown
  'assisted-narrow-pull-up': 'https://static.exercisedb.dev/media/50BETrz.gif', // biceps narrow pull-ups
  'machine-neutral-row': 'https://static.exercisedb.dev/media/7I6LNUG.gif', // lever seated row

  // Abs
  'crunch-machine': 'https://static.exercisedb.dev/media/ZnJHhMk.gif', // lever seated crunch

  // Épaules
  'dumbbell-lateral-raise': 'https://static.exercisedb.dev/media/DsgkuIt.gif',
  'cable-lateral-raise': 'https://static.exercisedb.dev/media/goJ6ezq.gif',
  'dumbbell-shoulder-press': 'https://static.exercisedb.dev/media/znQUdHY.gif',
  'machine-shoulder-press': 'https://static.exercisedb.dev/media/67n3r98.gif',
  'dumbbell-front-raise': 'https://static.exercisedb.dev/media/3eGE2JC.gif',
  'cable-upright-row': 'https://static.exercisedb.dev/media/cALKspW.gif',
  'dumbbell-rear-lateral-raise': 'https://static.exercisedb.dev/media/v1qBec9.gif',
}

export function getExerciseGif(id: string): string | undefined {
  if (EXERCISE_GIFS[id]) return EXERCISE_GIFS[id]
  // Custom exercises from ExerciseDB stored in localStorage
  if (id.startsWith('ext-')) {
    const custom = JSON.parse(localStorage.getItem('custom-exercises') || '{}')
    return custom[id]?.gifUrl
  }
  return undefined
}
