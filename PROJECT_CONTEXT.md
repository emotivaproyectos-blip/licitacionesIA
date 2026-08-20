# Contexto del proyecto: LicitIA

> Documento de referencia para analizar o continuar el proyecto sin tener que recorrer el repositorio completo. Actualizarlo cuando cambien la arquitectura, los flujos principales o el estado de integración.

## Propósito

**LicitIA** (también descrito como *PostulaIA*) es una plataforma SaaS para empresas colombianas que participan en contratación pública. Su objetivo es reducir el trabajo manual de revisar procesos de **SECOP I, SECOP II y Datos Abiertos**:

1. Descubre y monitorea licitaciones públicas.
2. Lee pliegos, anexos y adendas.
3. Extrae requisitos financieros, de experiencia RUP/UNSPSC y jurídicos.
4. Compara esos requisitos contra el perfil de una empresa.
5. Entrega un puntaje, riesgos, faltantes y una recomendación de participación.
6. Pretende preparar una lista de verificación y documentos para la postulación en SECOP II.

La propuesta de producto se resume en: **la empresa no debería tener que leer un pliego completo para saber si puede y conviene postularse**.

## Estado actual

Es un **MVP/prototipo de interfaz y arquitectura**. La estructura para la solución final existe, pero varias integraciones y flujos aún son datos de demostración o simulaciones.

| Área | Estado actual |
| --- | --- |
| Interfaz web | Dashboard visual completo, con datos locales simulados. |
| API | FastAPI funcional con endpoints de salud, listado y evaluación. El listado y el perfil evaluado están simulados. |
| Motor de compatibilidad | Implementado como reglas determinísticas para liquidez, endeudamiento, UNSPSC y experiencia en SMMLV. |
| SECOP/Datos Abiertos | Cliente SODA implementado y con datos de respaldo, pero no está conectado al endpoint de listado principal. |
| IA/LLM | Gemini está conectado por API REST desde el backend para generar el resumen narrativo de una evaluación. OpenAI, Anthropic y DeepSeek siguen simulados. |
| Procesamiento de PDF/RAG | Esqueleto presente: PyMuPDF extrae texto; OCR, tablas, embeddings y búsqueda aún son simulados/parciales. |
| Agentes | Orquestador con 10 nodos implementados como secuencia simulada. El texto menciona 11 agentes, pero no hay un undécimo nodo operativo claramente definido. |
| Persistencia | Esquema PostgreSQL + pgvector amplio; la API aún no usa base de datos. |
| Postulación | La UI simula la generación de documentos; no existe integración real con SECOP ni generación de archivos. |

## Arquitectura y tecnologías

```text
apps/web                 React 18 + TypeScript + Vite + Tailwind
        |
        | HTTP (cliente ya creado, pero la pantalla actual usa mocks)
        v
apps/api                 FastAPI + Pydantic
        |
        +-- Matching: reglas de compatibilidad
        +-- SECOP: cliente SODA para Datos Abiertos
        +-- Documentos: PDF/OCR y RAG (base inicial)
        +-- Agentes: flujo inspirado en LangGraph
        +-- IA: factoría de proveedores LLM
        |
        v
PostgreSQL + pgvector    Definido en Docker y schema.sql
Redis                    Definido como caché/cola, aún sin uso desde la API
```

El entorno de desarrollo de infraestructura está en `docker/docker-compose.yml` y crea PostgreSQL (puerto 5432), Redis (6379) y API (8000). El frontend se ejecuta separadamente desde `apps/web`.

## Estructura clave

| Ruta | Responsabilidad |
| --- | --- |
| `apps/web/src/App.tsx` | Dashboard principal de una sola pantalla. Actualmente contiene las licitaciones, chat y acción de postularse como estado local simulado. |
| `apps/web/src/services/api.ts` | Cliente HTTP preparado para consumir FastAPI. No está conectado a `App.tsx` actualmente. |
| `apps/api/app/main.py` | Aplicación FastAPI y endpoints públicos. |
| `apps/api/app/modules/matching/engine.py` | Cálculo del puntaje de compatibilidad y veredicto. |
| `apps/api/app/modules/secop/soda_client.py` | Consulta de procesos SECOP II por API SODA de Datos Abiertos, con respaldo local. |
| `apps/api/app/modules/documents/pipeline.py` | Extracción inicial de texto PDF y tablas. |
| `apps/api/app/modules/documents/embeddings.py` | Partición de texto y resultados RAG simulados. |
| `apps/api/app/modules/agents/workflows.py` | Flujo de agentes para ingesta, requisitos, matching, explicación, checklist y seguimiento. |
| `apps/api/app/core/ai_provider.py` | Abstracción de proveedores y modelos de IA; Gemini realiza llamadas REST reales usando `GEMINI_API_KEY` solo en el servidor. |
| `apps/api/app/db/schema.sql` | Modelo de datos SQL, RLS e índice pgvector. |

## API disponible

| Método y ruta | Uso | Estado |
| --- | --- | --- |
| `GET /` | Salud y metadatos del servicio. | Funcional. |
| `GET /api/v1/tenders` | Lista licitaciones; acepta `status`, `min_budget` y `department`. | Devuelve dos registros de demostración; los filtros aún no se aplican. |
| `POST /api/v1/tenders/evaluate` | Evalúa compatibilidad. Recibe `organization_id`, `tender_id`, `model_provider` y opcionalmente `model_name`. | Ejecuta el motor con perfil y requisitos de demostración. |

## Lógica de compatibilidad actual

El motor pondera:

- **40 % financiero:** liquidez mínima y endeudamiento máximo.
- **40 % experiencia:** al menos un código UNSPSC en común y valor total de experiencia en SMMLV.
- **20 % jurídico:** actualmente se asume cumplimiento total.

Los veredictos son:

- `RECOMMENDED`: puntaje mayor o igual a 80.
- `RISKY`: puntaje entre 50 y 79.9.
- `NOT_RECOMMENDED`: puntaje menor a 50.

## Modelo de datos previsto

Las entidades principales son: organizaciones, usuarios, perfiles financieros, experiencias RUP, licitaciones, documentos de licitación, embeddings, requisitos extraídos, evaluaciones de compatibilidad y listas de verificación de postulación.

El esquema contempla multitenencia mediante `organization_id`, eliminación lógica en varias tablas, RLS para organizaciones/usuarios y vectores de 1536 dimensiones con pgvector.

## Prioridades técnicas recomendadas

1. Conectar el dashboard React al cliente API y eliminar los datos duplicados/simulados de `App.tsx`.
2. Conectar `GET /api/v1/tenders` con `SECOPDatosAbiertosClient` y, después, persistir resultados en PostgreSQL.
3. Reemplazar perfiles, requisitos y experiencias de demostración por consultas reales a la base de datos.
4. Implementar autenticación, autorización y configuración segura de CORS antes de producción.
5. Completar el procesamiento de documentos: carga de archivos, OCR real, extracción estructurada, embeddings y RAG con fuentes citables.
6. Integrar proveedores LLM reales, validación estructurada de respuestas, trazabilidad y manejo de costos/errores.
7. Convertir el flujo de agentes en un grafo LangGraph real y definir con precisión los 11 agentes anunciados.
8. Implementar generación de documentos y cualquier integración con SECOP solo tras revisar requisitos legales, seguridad y permisos.

## Riesgos y observaciones para futuras revisiones

- Hay texto con problemas de codificación visible como `Ã³` y `âœ“` en archivos fuente; normalizar a UTF-8 sería una mejora transversal.
- `allow_origins=["*"]` junto con credenciales no es adecuado para producción.
- `schema.sql` referencia `auth.uid()` y `auth.users`, propios de Supabase, mientras Docker levanta PostgreSQL/pgvector genérico: esa combinación necesita una estrategia clara para que las políticas RLS funcionen.
- Redis y varias dependencias declaradas no están conectados a lógica de aplicación todavía.
- No hay pruebas automatizadas, migraciones, autenticación ni documentación de instalación en el repositorio.
- No asumir que una recomendación automática basta para una decisión legal o de postulación: debe conservar evidencias de pliego y requerir revisión humana.

## Cómo usar este contexto en futuros pedidos

Al pedir un análisis o cambio, indicar el objetivo y, si aplica, el área: `frontend`, `API`, `SECOP`, `matching`, `documentos/RAG`, `IA`, `base de datos`, `seguridad` o `despliegue`.

Ejemplos:

- "Usa `PROJECT_CONTEXT.md` y revisa qué falta para conectar el frontend a la API."
- "Basado en el contexto, implementa persistencia real de las evaluaciones."
- "Analiza los riesgos de seguridad del MVP de LicitIA y priorízalos."
