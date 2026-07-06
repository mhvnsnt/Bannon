# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright 2022, RancidMilk <rancidmilkgames@gmail.com> *Uses code from the Blender Foundation*

#     This program is free software: you can redistribute it and/or modify
#     it under the terms of the GNU General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     This program is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU General Public License for more details.
#
#     You should have received a copy of the GNU General Public License
#     along with this program.  If not, see <https://www.gnu.org/licenses/>.

import os
from tempfile import TemporaryFile
import subprocess

# See instructions.txt for how to set these up

# Max number of times to run the program. This is to prevent any possible infinite loop.
# The program should quit when it finishes, but just in case it doesn't
max_runs = 100
# Path to blender.exe. If you add blender to your path you can just use "blender" instead of the full path
# This is the Windows path of 3.3. I really should be using os.path.join() instead of hard-coding the slashes
blender_path = "C:\\Program Files\\Blender Foundation\\Blender 3.3\\blender.exe"
# Path to .blend file with bone map, but removed rig/armature. Should end in ".blend".
blend_with_map_removed_rig = ""
# Path to python file to run in blender. Should end in ".py"
# You can leave this alone if you keep the script in the same folder as this one, otherwise set the path
blend_script = "convert.py"
# Hopefully this variable doesn't get used.
# This is how many times the program will retry if something goes wrong
max_fails = 3


def run_program():
    global max_runs
    global blender_path
    global blend_with_model
    global blend_script
    global max_fails
    # Since we're converting a bunch of files, I added a try/except block in case of an off error
    # This means if you leave it converting and walk away, it has a chance to recover
    try:
        with TemporaryFile() as f:
            finished = subprocess.run([blender_path,
                                       blend_with_map_removed_rig,
                                       "-P",
                                       blend_script],
                                      stdout=f)
            f.seek(0)
            if "Yo, I finished converting" in f.read().decode("utf-8"):
                print("Yo, I'm done converting everything. Immma take a break.")
                quit(0)
            max_runs -= 1
            print("possible runs left: " + str(max_runs))
    # If something goes wrong, we'll try again. This really shouldn't happen, especially very often
    # Chances are, if you get an error, it's because you didn't set the paths/variables correctly
    except Exception as e:
        max_fails -= 1
        print(e)
        # After the max number of fails, we'll just quit. Something is probably wrong like a path
        if max_fails <= 0:
            print("Too many fails. Quitting")
            quit(1)
        print("Failed! Retrying " + str(max_fails) + " more times")
    if max_runs <= 0:
        print("Max runs reached. Quitting")
        quit(0)
    else:
        run_program()


run_program()
