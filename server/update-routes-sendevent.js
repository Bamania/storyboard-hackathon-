const fs = require('fs');
let content = fs.readFileSync('src/routes/debate.routes.ts', 'utf8');

const parseCode = `
        const parsedSceneParams = { ...sceneParams };
        for (const key of ['director_parameters', 'cinematographer_parameters', 'production_designer_parameters', 'editor_parameters']) {
          if (typeof parsedSceneParams[key] === 'string') {
            try { parsedSceneParams[key] = JSON.parse(parsedSceneParams[key]); } catch (e) {}
          }
        }
`;

content = content.replace(
  `        const sceneParams = session?.state?.['last_scene_parameters'] as Record<string, unknown>;
        sendEvent({ type: 'scene_complete', scene_index: lastComplete, shot_parameters: sceneParams ?? {} });`,
  `        const sceneParams = session?.state?.['last_scene_parameters'] as Record<string, unknown>;${parseCode}
        sendEvent({ type: 'scene_complete', scene_index: lastComplete, shot_parameters: parsedSceneParams ?? {} });`
);

content = content.replace(
  `      const sceneParams = finalSession?.state?.['last_scene_parameters'] as Record<string, unknown>;
      sendEvent({ type: 'scene_complete', scene_index: finalLastComplete, shot_parameters: sceneParams ?? {} });`,
  `      const sceneParams = finalSession?.state?.['last_scene_parameters'] as Record<string, unknown>;${parseCode}
      sendEvent({ type: 'scene_complete', scene_index: finalLastComplete, shot_parameters: parsedSceneParams ?? {} });`
);

content = content.replaceAll("sceneParams?.['director_parameters']", "parsedSceneParams?.['director_parameters']");
content = content.replaceAll("sceneParams?.['cinematographer_parameters']", "parsedSceneParams?.['cinematographer_parameters']");
content = content.replaceAll("sceneParams?.['production_designer_parameters']", "parsedSceneParams?.['production_designer_parameters']");
content = content.replaceAll("sceneParams?.['editor_parameters']", "parsedSceneParams?.['editor_parameters']");

fs.writeFileSync('src/routes/debate.routes.ts', content);
