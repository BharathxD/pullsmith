FROM langchain/langgraphjs-api:20
ADD . /deps/pullsmith
ENV LANGSERVE_GRAPHS='{"agent":"./agent/agent.ts:graph"}'
WORKDIR /deps/pullsmith
RUN pnpm i --frozen-lockfile
COPY .env /api/langgraph_api/.env
RUN (test ! -f /api/langgraph_api/js/build.mts && echo "Prebuild script not found, skipping") || tsx /api/langgraph_api/js/build.mts
