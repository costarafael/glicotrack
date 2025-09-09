# Correção para o Build com a Nova Arquitetura do React Native

Este documento descreve os passos para corrigir o problema de build do projeto Android com a Nova Arquitetura do React Native habilitada.

## Problema

Ao tentar compilar o projeto com a Nova Arquitetura (`newArchEnabled=true` em `android/gradle.properties`), o build falhava com um erro de CMake, informando que os diretórios de JNI gerados pelo Codegen não eram encontrados. Exemplo do erro:

```
CMake Error at ... Android-autolinking.cmake:10 (add_subdirectory):
add_subdirectory given source ".../node_modules/@react-native-async-storage/async-storage/android/build/generated/source/codegen/jni/" which is not an existing directory.
```

## Solução

A causa raiz do problema era que a tarefa de geração do Codegen não estava sendo executada antes da tarefa de compilação do CMake, resultando na ausência dos arquivos JNI necessários.

A solução consiste em executar manualmente a tarefa de geração do Codegen antes de compilar o aplicativo.

**Nota sobre dependências:** Caso encontre erros de `ERESOLVE` ao instalar as dependências com `npm install`, utilize a seguinte flag para contornar o problema:
```bash
npm install --legacy-peer-deps
```

### Passos

1.  **Certifique-se de que a Nova Arquitetura está habilitada:**
    No arquivo `android/gradle.properties`, a propriedade `newArchEnabled` deve estar configurada como `true`:
    ```properties
    newArchEnabled=true
    ```

2.  **Execute a tarefa de geração do Codegen:**
    Abra um terminal na raiz do projeto e execute o seguinte comando:
    ```bash
    cd android && ./gradlew generateCodegenArtifactsFromSchema
    ```
    Este comando irá gerar os artefatos de código necessários para as bibliotecas nativas.

3.  **Compile o aplicativo:**
    Após a conclusão da tarefa anterior, você pode compilar o projeto normalmente. Para gerar o APK de release, execute:
    ```bash
    cd android && ./gradlew assembleRelease
    ```

## Observação

A tentativa de alterar a versão do CMake não resolveu o problema. A versão do CMake configurada no projeto (`3.22.1`) é adequada, e o problema não estava relacionado a ela.
