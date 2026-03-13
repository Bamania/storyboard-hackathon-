const fs = require('fs');
let content = fs.readFileSync('src/routes/debate.routes.ts', 'utf8');
content = content.replaceAll(
  ` directorParams: (sceneParams?.['director_parameters'] as object) ?? {},
              cinematographerParams: (sceneParams?.['cinematographer_parameters'] as object) ?? {},
              productionDesignerParams: (sceneParams?.['production_designer_parameters'] as object) ?? {},
              editorParams: (sceneParams?.['editor_parameters'] as object) ?? {},`,
  ` directorParams: typeof sceneParams?.['director_parameters'] === 'string' ? JSON.parse(sceneParams['director_parameters']) : (sceneParams?.['director_parameters'] as object) ?? {},
              cinematographerParams: typeof sceneParams?.['cinematographer_parameters'] === 'string' ? JSON.parse(sceneParams['cinematographer_parameters']) : (sceneParams?.['cinematographer_parameters'] as object) ?? {},
              productionDesignerParams: typeof sceneParams?.['production_designer_parameters'] === 'string' ? JSON.parse(sceneParams['production_designer_parameters']) : (sceneParams?.['production_designer_parameters'] as object) ?? {},
              editorParams: typeof sceneParams?.['editor_parameters'] === 'string' ? JSON.parse(sceneParams['editor_parameters']) : (sceneParams?.['editor_parameters'] as object) ?? {},`
);

content = content.replaceAll(
  `directorParams: (sceneParams?.['director_parameters'] as object) ?? {},
            cinematographerParams: (sceneParams?.['cinematographer_parameters'] as object) ?? {},
            productionDesignerParams: (sceneParams?.['production_designer_parameters'] as object) ?? {},
            editorParams: (sceneParams?.['editor_parameters'] as object) ?? {},`,
  `directorParams: typeof sceneParams?.['director_parameters'] === 'string' ? JSON.parse(sceneParams['director_parameters']) : (sceneParams?.['director_parameters'] as object) ?? {},
            cinematographerParams: typeof sceneParams?.['cinematographer_parameters'] === 'string' ? JSON.parse(sceneParams['cinematographer_parameters']) : (sceneParams?.['cinematographer_parameters'] as object) ?? {},
            productionDesignerParams: typeof sceneParams?.['production_designer_parameters'] === 'string' ? JSON.parse(sceneParams['production_designer_parameters']) : (sceneParams?.['production_designer_parameters'] as object) ?? {},
            editorParams: typeof sceneParams?.['editor_parameters'] === 'string' ? JSON.parse(sceneParams['editor_parameters']) : (sceneParams?.['editor_parameters'] as object) ?? {},`
);

fs.writeFileSync('src/routes/debate.routes.ts', content);
