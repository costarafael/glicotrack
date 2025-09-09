//
//  GlicoTrack-Bridging-Header.h
//  GlicoTrack
//
//  Created by Rafael Aredes on 08/09/25.
//

#ifndef GlicoTrack_Bridging_Header_h
#define GlicoTrack_Bridging_Header_h

//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//

// XCODE 16.4 WORKAROUND: Swift bridging header não herda definições do .pch
// Definir constantes explicitamente aqui para UIKit compilation

// Forçar definições antes de qualquer header
#undef FLT_MAX
#undef FLT_MIN
#define FLT_MAX 3.40282347e+38F
#define FLT_MIN 1.17549435e-38F

// Incluir float.h para garantir outras definições
#include <float.h>

// Redefinir se necessário após float.h
#undef FLT_MAX
#undef FLT_MIN  
#define FLT_MAX 3.40282347e+38F
#define FLT_MIN 1.17549435e-38F

#import <Foundation/Foundation.h>
// UIKit removido temporariamente devido a bug do Xcode 16.4 com FLT_MAX/FLT_MIN
// O AppDelegate.swift e Prefix Header (.pch) já importam UIKit onde necessário
// #import <UIKit/UIKit.h>

#endif /* GlicoTrack_Bridging_Header_h */